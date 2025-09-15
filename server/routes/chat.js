const express = require('express');
const { supabase } = require('../config/supabase');
const { ollamaService } = require('../services/ollamaService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Optional auth middleware for demo mode
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided - use demo mode
      req.userId = 'demo-user-123';
      req.user = { id: 'demo-user-123' };
      console.log('⚠️ Running in demo mode without authentication');
      return next();
    }

    // Try to verify token
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };
      next();
    } catch (tokenError) {
      // Invalid token - fall back to demo mode
      req.userId = 'demo-user-123';
      req.user = { id: 'demo-user-123' };
      console.log('⚠️ Invalid token, running in demo mode');
      next();
    }
  } catch (error) {
    // Any other error - fall back to demo mode
    req.userId = 'demo-user-123';
    req.user = { id: 'demo-user-123' };
    console.log('⚠️ Auth error, running in demo mode:', error.message);
    next();
  }
};

// @route   POST /api/chat/query
// @desc    Send query to RAG system
// @access  Private (with demo fallback)
router.post('/query', optionalAuth, async (req, res) => {
  try {
    const { contractId, query, message, sessionId } = req.body;
    const queryMessage = query || message;

    if (!queryMessage) {
      return res.status(400).json({
        message: 'Query message is required'
      });
    }

    let response;
    let context = '';

    // If contractId is provided, get document context
    if (contractId) {
      let contract;
      let isDemo = req.userId === 'demo-user-123';
      
      if (isDemo) {
        // Use demo contract data
        const demoContracts = {
          'employment-001': {
            content: 'EMPLOYMENT AGREEMENT\n\nThis Employment Agreement is entered into between TechCorp Inc. and John Smith.\n\nPosition: Senior Software Engineer\nSalary: $95,000 annually\nBenefits: Health insurance, 401k matching, 3 weeks PTO\nTermination: Either party may terminate with 2 weeks notice\nNon-compete: 6 months in same industry within 50 miles\nConfidentiality: Employee agrees to protect company trade secrets',
            file_name: 'Employment_Agreement_TechCorp.pdf',
            status: 'completed'
          },
          'lease-002': {
            content: 'RESIDENTIAL LEASE AGREEMENT\n\nLandlord: ABC Property Management\nTenant: Jane Doe\nProperty: 123 Main St, Apt 4B\nRent: $1,800 per month\nSecurity Deposit: $3,600\nLease Term: 12 months starting January 1, 2024\nPet Policy: No pets allowed\nUtilities: Tenant responsible for electricity and internet\nMaintenance: Landlord responsible for major repairs',
            file_name: 'Lease_Agreement_MainSt.pdf',
            status: 'completed'
          }
        };
        
        contract = demoContracts[contractId] || demoContracts['employment-001'];
        console.log(`💬 Processing demo query about "${contract.file_name}": "${queryMessage}"`);
      } else {
        // Get real contract from database
        const { data, error } = await supabase
          .from('contracts')
          .select('content, file_name, status')
          .eq('id', contractId)
          .eq('user_id', req.userId)
          .single();

        if (error || !data) {
          return res.status(404).json({
            message: 'Contract not found'
          });
        }

        if (data.status !== 'completed') {
          return res.status(400).json({
            message: 'Contract is still being processed. Please wait for processing to complete.',
            status: data.status
          });
        }

        contract = data;
        console.log(`💬 Processing query about "${contract.file_name}": "${queryMessage}"`);
      }

      context = contract.content;
      response = await ollamaService.answerQuestion(queryMessage, context);
    } else {
      // General question - search across all user's completed contracts for context
      console.log(`💬 Processing general query with RAG: "${queryMessage}"`);
      
      // Get all user's completed contracts for potential context
      const { data: userContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('content, file_name, title')
        .eq('user_id', req.userId)
        .eq('status', 'completed')
        .not('content', 'is', null);

      if (!contractsError && userContracts && userContracts.length > 0) {
        // Load all user documents into vector store for RAG
        console.log(`🔍 Found ${userContracts.length} completed contracts for RAG search`);
        await ollamaService.loadUserDocuments(req.userId);
        
        // Now use RAG-enabled question answering
        response = await ollamaService.answerQuestion(queryMessage);
        
        // If RAG didn't find relevant context, provide contract list context
        if (!response.hasContext) {
          const contractList = userContracts.map(c => c.title || c.file_name).join(', ');
          const contextualPrompt = `I have uploaded the following contracts: ${contractList}. ${queryMessage}`;
          
          // Use a smaller subset of content to avoid token limits
          const recentContent = userContracts.slice(0, 3).map(c => 
            `Document: ${c.title || c.file_name}\nContent: ${c.content.substring(0, 1000)}...`
          ).join('\n\n---\n\n');
          
          response = await ollamaService.answerQuestion(contextualPrompt, recentContent);
        }
      } else {
        // No contracts available, answer as general AI
        console.log(`💬 No contracts found, answering as general AI`);
        response = await ollamaService.answerQuestion(queryMessage);
      }
    }

    // Save chat message to database
    if (contractId) {
      try {
        // Check if chat session exists
        let { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('contract_id', contractId)
          .eq('user_id', req.userId)
          .single();

        if (sessionError || !session) {
          // Create new chat session
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert([{
              contract_id: contractId,
              user_id: req.userId,
              title: `Chat about contract`,
              messages: []
            }])
            .select()
            .single();

          if (!createError) {
            session = newSession;
          }
        }

        if (session) {
          // Add messages to the session
          const messages = session.messages || [];
          messages.push({
            role: 'user',
            content: queryMessage,
            timestamp: new Date().toISOString()
          });
          messages.push({
            role: 'assistant',
            content: response.answer,
            hasContext: response.hasContext,
            timestamp: new Date().toISOString()
          });

          // Update session with new messages
          await supabase
            .from('chat_sessions')
            .update({
              messages: messages,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);
        }
      } catch (chatError) {
        console.error('Chat session error:', chatError);
        // Don't fail the request if chat session fails
      }
    }

    res.json({
      message: 'Query processed successfully',
      answer: response.answer,
      sources: response.sources || [],
      hasContext: response.hasContext || !!context,
      contractId: contractId || null
    });

  } catch (error) {
    console.error('Chat query error:', error);
    res.status(500).json({
      message: 'Error processing query',
      error: error.message
    });
  }
});

// @route   GET /api/chat/sessions/:contractId
// @desc    Get chat history
// @access  Private
router.get('/sessions/:contractId', auth, async (req, res) => {
  try {
    const { contractId } = req.params;

    // Get chat session for this contract
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('contract_id', contractId)
      .eq('user_id', req.userId)
      .single();

    if (error || !session) {
      return res.json({
        messages: [],
        message: 'No chat history found'
      });
    }

    // Format messages for frontend
    const formattedMessages = (session.messages || []).map((msg, index) => ({
      id: `${msg.role}-${index}-${new Date(msg.timestamp).getTime()}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      sources: msg.sources || []
    }));

    res.json({
      messages: formattedMessages,
      sessionId: session.id,
      contractId: session.contract_id
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      message: 'Error retrieving chat history',
      error: error.message
    });
  }
});

// @route   DELETE /api/chat/sessions/:sessionId
// @desc    Clear chat session
// @access  Private
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete the chat session
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', req.userId);

    if (error) {
      console.error('Session delete error:', error);
      return res.status(500).json({
        message: 'Error clearing chat session',
        error: error.message
      });
    }

    res.json({
      message: 'Chat session cleared successfully'
    });

  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({
      message: 'Error clearing chat session',
      error: error.message
    });
  }
});

// @route   GET /api/chat/platform-info
// @desc    Get SmartContract.ai platform information
// @access  Public
router.get('/platform-info', async (req, res) => {
  try {
    const platformInfo = ollamaService.getPlatformInfo();
    const faq = ollamaService.getFrequentlyAskedQuestions();
    const optimizationStatus = ollamaService.getOptimizationStatus();

    res.json({
      message: 'Platform information retrieved successfully',
      platformInfo,
      faq,
      optimizationStatus,
      helpfulTips: [
        "Ask me about SmartContract.ai features and capabilities",
        "Upload documents to get AI-powered contract analysis",
        "Use natural language to query your documents",
        "Check out our privacy-first approach with local AI processing",
        "Get help with setup, troubleshooting, and best practices"
      ]
    });

  } catch (error) {
    console.error('Platform info error:', error);
    res.status(500).json({
      message: 'Error retrieving platform information',
      error: error.message
    });
  }
});

// @route   GET /api/chat/help
// @desc    Get quick help and suggestions
// @access  Public
router.get('/help', async (req, res) => {
  try {
    const helpInfo = {
      quickStart: [
        "1. Create an account and log in",
        "2. Upload your contract or document (PDF, Word, Image)",
        "3. Wait for AI processing to complete",
        "4. Start asking questions about your document",
        "5. Get instant AI-powered insights and analysis"
      ],
      exampleQuestions: [
        "What are the key terms in this contract?",
        "What is the termination policy?",
        "Are there any risks I should be aware of?",
        "Summarize the payment terms",
        "What are my obligations under this agreement?"
      ],
      platformQuestions: [
        "What features does SmartContract.ai offer?",
        "How does the AI analysis work?",
        "What file formats are supported?",
        "Is my data private and secure?",
        "How do I get the best results from the AI?"
      ],
      technicalInfo: {
        aiModel: "llama3.2:3b (optimized for RTX 3050)",
        processingType: "Local AI processing for complete privacy",
        supportedFormats: ["PDF", "Word", "Images", "Text"],
        responseTime: "2-5 seconds typical",
        features: ["OCR", "RAG", "Vector Search", "Document Analysis"]
      }
    };

    res.json({
      message: 'Help information retrieved successfully',
      help: helpInfo,
      status: 'ready'
    });

  } catch (error) {
    console.error('Help endpoint error:', error);
    res.status(500).json({
      message: 'Error retrieving help information',
      error: error.message
    });
  }
});

module.exports = router;