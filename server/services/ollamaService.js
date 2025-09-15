const { Ollama } = require('ollama');
const { OllamaEmbeddings } = require('@langchain/community/embeddings/ollama');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const natural = require('natural');
const Tesseract = require('tesseract.js');
const { APPLICATION_KNOWLEDGE } = require('../config/applicationKnowledge');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
    this.embeddings = new OllamaEmbeddings({
      model: this.embeddingModel,
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
    });
    
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // Model configuration for Llama 3.2 3B
    this.contextSize = parseInt(process.env.OLLAMA_CONTEXT_SIZE) || 8192; // Llama 3.2 supports up to 128K context
    this.gpuLayers = parseInt(process.env.OLLAMA_GPU_LAYERS) || -1; // Use all available GPU layers
    
    this.vectorStore = null;
    this.userVectorStores = new Map(); // userId -> vectorStore for isolation
    this.modelsWarmedUp = false;
  }

  // Check if Ollama is running and models are available
  async checkHealth() {
    try {
      const models = await this.ollama.list();
      const hasMainModel = models.models.some(m => m.name.includes(this.model));
      const hasEmbeddingModel = models.models.some(m => m.name.includes(this.embeddingModel));
      
      return {
        status: 'healthy',
        ollamaRunning: true,
        mainModel: hasMainModel ? this.model : 'not found',
        embeddingModel: hasEmbeddingModel ? this.embeddingModel : 'not found',
        availableModels: models.models.map(m => m.name)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        ollamaRunning: false,
        error: error.message,
        suggestion: 'Please ensure Ollama is running and models are installed'
      };
    }
  }

  // Pull models if they don't exist
  async ensureModels() {
    try {
      const health = await this.checkHealth();
      
      if (!health.ollamaRunning) {
        throw new Error('Ollama is not running. Please start Ollama first.');
      }

      // Pull main model if not available
      if (health.mainModel === 'not found') {
        console.log(`📥 Pulling main model: ${this.model}...`);
        await this.ollama.pull({ model: this.model });
        console.log(`✅ Main model ${this.model} pulled successfully`);
      }

      // Pull embedding model if not available
      if (health.embeddingModel === 'not found') {
        console.log(`📥 Pulling embedding model: ${this.embeddingModel}...`);
        await this.ollama.pull({ model: this.embeddingModel });
        console.log(`✅ Embedding model ${this.embeddingModel} pulled successfully`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error ensuring models:', error.message);
      return false;
    }
  }

  // OCR functionality using Tesseract
  async extractTextFromImage(imageBuffer) {
    try {
      console.log('🔍 Extracting text from image using OCR...');
      
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      // Clean up the extracted text
      const cleanedText = text
        .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      console.log(`✅ OCR completed. Extracted ${cleanedText.length} characters`);
      return cleanedText;
    } catch (error) {
      console.error('❌ OCR Error:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  // Enhanced OCR with AI-powered text cleanup and understanding
  async enhancedOCR(imageBuffer) {
    try {
      // First, extract raw text using OCR
      const rawText = await this.extractTextFromImage(imageBuffer);
      
      if (!rawText || rawText.trim().length < 10) {
        return { rawText, enhancedText: rawText, summary: 'No significant text found' };
      }

      // Use Ollama to clean up and enhance the OCR text
      const prompt = `You are an expert at cleaning up and enhancing OCR-extracted text. Please:

1. Fix common OCR errors (character misrecognition, spacing issues, etc.)
2. Improve formatting and structure
3. Correct obvious spelling and grammar errors
4. Maintain the original meaning and content

Original OCR text:
${rawText}

Please provide:
1. CLEANED_TEXT: The corrected and formatted text
2. SUMMARY: A brief summary of what the document appears to be about`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: this.contextSize,
          num_gpu: this.gpuLayers,
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1000
        }
      });

      // Parse the response to extract cleaned text and summary
      const content = response.response;
      const cleanedTextMatch = content.match(/CLEANED_TEXT:?\s*([\s\S]*?)(?=SUMMARY:|$)/i);
      const summaryMatch = content.match(/SUMMARY:?\s*([\s\S]*?)$/i);

      const enhancedText = cleanedTextMatch ? cleanedTextMatch[1].trim() : rawText;
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Document processed';

      return {
        rawText,
        enhancedText,
        summary,
        confidence: this.calculateTextQuality(rawText, enhancedText)
      };
    } catch (error) {
      console.error('❌ Enhanced OCR Error:', error);
      return {
        rawText: await this.extractTextFromImage(imageBuffer),
        enhancedText: null,
        summary: 'Enhancement failed',
        error: error.message
      };
    }
  }

  // Calculate text quality score
  calculateTextQuality(rawText, enhancedText) {
    if (!rawText || !enhancedText) return 0;
    
    const rawWords = rawText.split(/\s+/).length;
    const enhancedWords = enhancedText.split(/\s+/).length;
    const lengthRatio = Math.min(enhancedWords / rawWords, 2); // Cap at 2x
    
    // Simple quality heuristics
    const hasProperSentences = enhancedText.includes('.') && enhancedText.includes(' ');
    const hasReasonableLength = enhancedText.length > 20;
    
    let score = 0.5; // Base score
    if (hasProperSentences) score += 0.3;
    if (hasReasonableLength) score += 0.2;
    score *= lengthRatio;
    
    return Math.min(score, 1.0);
  }

  // Create vector store from documents
  async createVectorStore(documents) {
    try {
      console.log(`🔍 Creating vector store from ${documents.length} documents...`);
      
      // Split documents into chunks
      const chunks = await this.textSplitter.splitDocuments(documents);
      console.log(`📄 Split into ${chunks.length} chunks`);

      // Create vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        chunks,
        this.embeddings
      );

      console.log('✅ Vector store created successfully');
      return this.vectorStore;
    } catch (error) {
      console.error('❌ Error creating vector store:', error);
      throw error;
    }
  }

  // Add documents to existing vector store
  async addDocuments(documents) {
    try {
      if (!this.vectorStore) {
        return await this.createVectorStore(documents);
      }

      const chunks = await this.textSplitter.splitDocuments(documents);
      await this.vectorStore.addDocuments(chunks);
      
      console.log(`✅ Added ${chunks.length} chunks to vector store`);
      return this.vectorStore;
    } catch (error) {
      console.error('❌ Error adding documents:', error);
      throw error;
    }
  }

  // Perform similarity search
  async similaritySearch(query, k = 5) {
    try {
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized. Please add documents first.');
      }

      const results = await this.vectorStore.similaritySearch(query, k);
      return results.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        relevanceScore: doc.score || 0
      }));
    } catch (error) {
      console.error('❌ Error in similarity search:', error);
      throw error;
    }
  }

  // Check if question is about the SmartContract.ai application
  isApplicationQuery(question) {
    const appQuestionPatterns = [
      /what (is|does|can|features|capabilities)/i,
      /how (do i|to|does|can i)/i,
      /smartcontract\.ai|smart contract ai/i,
      /(tell me about|explain|describe) (this|the) (app|application|platform|system)/i,
      /(what|how|why|when|where).*(app|application|platform|system|features|upload|document|contract|analysis)/i,
      /privacy|security|data|policy|policies/i,
      /support|help|guide|tutorial|setup/i,
      /technical|specs|requirements|performance/i,
      /pricing|cost|free|payment/i,
      /file types|formats|supported/i,
      /ollama|ai model|local processing/i,
      /registration|login|account|user/i
    ];

    return appQuestionPatterns.some(pattern => pattern.test(question));
  }

  // Get relevant application knowledge based on the query
  getRelevantAppKnowledge(question) {
    const lowerQuestion = question.toLowerCase();
    let relevantInfo = [];

    // Check for specific topics
    if (lowerQuestion.includes('privacy') || lowerQuestion.includes('data') || lowerQuestion.includes('security')) {
      relevantInfo.push(`Privacy & Security: ${JSON.stringify(APPLICATION_KNOWLEDGE.policies.privacy)}`);
      relevantInfo.push(`Security Details: ${JSON.stringify(APPLICATION_KNOWLEDGE.policies.security)}`);
    }

    if (lowerQuestion.includes('feature') || lowerQuestion.includes('what can') || lowerQuestion.includes('capabilities')) {
      relevantInfo.push(`Core Features: ${APPLICATION_KNOWLEDGE.features.core.join(', ')}`);
      relevantInfo.push(`AI Capabilities: ${APPLICATION_KNOWLEDGE.features.ai_capabilities.join(', ')}`);
    }

    if (lowerQuestion.includes('file') || lowerQuestion.includes('format') || lowerQuestion.includes('upload')) {
      relevantInfo.push(`Supported Formats: ${APPLICATION_KNOWLEDGE.features.supported_formats.join(', ')}`);
      relevantInfo.push(`Usage Limits: ${JSON.stringify(APPLICATION_KNOWLEDGE.policies.usage_limits)}`);
    }

    if (lowerQuestion.includes('technical') || lowerQuestion.includes('requirement') || lowerQuestion.includes('performance') || lowerQuestion.includes('hardware')) {
      relevantInfo.push(`Technical Specs: ${JSON.stringify(APPLICATION_KNOWLEDGE.technical_specs)}`);
    }

    if (lowerQuestion.includes('how to') || lowerQuestion.includes('guide') || lowerQuestion.includes('setup') || lowerQuestion.includes('start')) {
      relevantInfo.push(`Getting Started: ${APPLICATION_KNOWLEDGE.user_guide.getting_started.join(', ')}`);
      relevantInfo.push(`Best Practices: ${APPLICATION_KNOWLEDGE.user_guide.best_practices.join(', ')}`);
    }

    if (lowerQuestion.includes('api') || lowerQuestion.includes('endpoint')) {
      relevantInfo.push(`API Endpoints: ${JSON.stringify(APPLICATION_KNOWLEDGE.api_endpoints)}`);
    }

    // Check FAQ for similar questions
    const allFAQ = [...APPLICATION_KNOWLEDGE.faq.general, ...APPLICATION_KNOWLEDGE.faq.technical, ...APPLICATION_KNOWLEDGE.faq.usage];
    const relevantFAQ = allFAQ.filter(faq =>
      faq.question.toLowerCase().includes(lowerQuestion.split(' ')[0]) ||
      lowerQuestion.includes(faq.question.toLowerCase().split(' ')[0])
    );

    if (relevantFAQ.length > 0) {
      relevantInfo.push(`Relevant FAQ: ${JSON.stringify(relevantFAQ)}`);
    }

    // Always include basic app info for application queries
    if (this.isApplicationQuery(question)) {
      relevantInfo.unshift(`App Information: ${JSON.stringify(APPLICATION_KNOWLEDGE.appInfo)}`);
    }

    return relevantInfo.join('\n\n');
  }

  // RAG-powered question answering
  async answerQuestion(question, context = null) {
    try {
      // Check for simple greetings and casual conversation
      const greetingPatterns = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|how are you|what's up|yo)[\s!?]*$/i;
      if (greetingPatterns.test(question.trim())) {
        const greetingResponses = [
          "Hi there! 👋 I'm your SmartContract.ai assistant! I can help you with document analysis, answer questions about the platform, guide you through features, or just have a friendly chat. What would you like to know about?",
          "Hello! Welcome to SmartContract.ai! 😊 I'm here to help you with contract analysis, platform features, document processing, or any questions you might have. How can I assist you today?",
          "Hey! Great to see you using SmartContract.ai! I'm your AI companion for all things related to contract intelligence, document analysis, and platform guidance. What can I help you explore?",
          "Hi! I'm your SmartContract.ai assistant, ready to help with document analysis, platform questions, feature guidance, or general conversation. What's on your mind today?"
        ];

        const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

        return {
          answer: randomGreeting,
          context: 'Greeting response with SmartContract.ai context',
          hasContext: true
        };
      }

      let contextText = '';
      let isAppQuery = this.isApplicationQuery(question);

      if (context) {
        contextText = context;
      } else if (isAppQuery) {
        // Get application-specific knowledge for platform questions
        contextText = this.getRelevantAppKnowledge(question);
      } else if (this.vectorStore) {
        // Retrieve relevant documents for document-related queries
        const relevantDocs = await this.similaritySearch(question, 3);
        contextText = relevantDocs.map(doc => doc.content).join('\n\n');
      }

      const prompt = contextText
        ? (isAppQuery
          ? `You are the friendly, knowledgeable AI assistant for SmartContract.ai, an AI-powered contract intelligence platform. You have comprehensive knowledge about the application, its features, policies, and technical details. Communicate naturally and be helpful in explaining the platform's capabilities.

When answering questions about SmartContract.ai, use the provided application knowledge to give accurate, detailed responses. Be enthusiastic about the platform's features while being honest about limitations. Use phrases like "SmartContract.ai offers...", "With our platform, you can...", "Our AI system uses...", etc.

SmartContract.ai Platform Knowledge:
${contextText}

User Question: ${question}

Provide a comprehensive, friendly response about SmartContract.ai:`
          : `You are a friendly, conversational AI assistant for SmartContract.ai. You communicate naturally like ChatGPT - being helpful, clear, and engaging. You can analyze documents, answer questions about contracts, and provide general assistance. When documents are provided, you can analyze them in detail.

Be natural and personable in your response. If there's document context, use phrases like "I can see from the document that...", "Based on what I'm reading here...", etc. If the question isn't related to the document, feel free to answer it generally and conversationally while keeping in mind you're part of the SmartContract.ai platform.

Document Context:
${contextText}

User Question: ${question}

Please provide a natural, conversational response:`)
        : `You are a friendly, conversational AI assistant for SmartContract.ai, an AI-powered contract intelligence platform. You communicate naturally - being helpful, clear, and engaging. You can help with contract questions, document analysis, general legal concepts, or any other topics users might ask about.

Answer the user's question in a natural, conversational way. Be personable and use natural language patterns. Feel free to use phrases like "Great question!", "I'd be happy to help with that", "Here's what I can tell you...", etc. If relevant, you can mention SmartContract.ai's capabilities for document analysis and contract intelligence.

User Question: ${question}

Please provide a natural, conversational response:`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: this.contextSize,
          num_gpu: this.gpuLayers,
          temperature: 0.7,        // Higher temperature for more natural responses
          top_p: 0.9,
          top_k: 40,               // Add top_k for better diversity
          repeat_penalty: 1.1,     // Reduce repetitive responses
          num_predict: 1200        // Allow longer responses
        }
      });

      return {
        answer: response.response,
        context: contextText ? (isAppQuery ? 'Used SmartContract.ai platform knowledge' : 'Used document context') : 'General AI response',
        hasContext: !!contextText,
        queryType: isAppQuery ? 'platform' : (contextText ? 'document' : 'general')
      };
    } catch (error) {
      console.error('❌ Error answering question:', error);
      throw error;
    }
  }

  // Analyze contract or document
  async analyzeDocument(text) {
    try {
      const prompt = `You are a friendly, conversational AI assistant. Analyze the following document in a natural, ChatGPT-like manner. Be personable and engaging while providing helpful insights.

Please review this document and provide insights in a conversational way. Adapt your analysis based on what type of document this is - it could be a contract, agreement, article, code, or any other type of text. Structure your response naturally based on the content:

🔍 **Document Type**: What kind of document this appears to be (speak naturally, like "This looks like a..." or "I can see this is...")

📝 **Key Points**: The most important information or highlights (explain them conversationally, like "The main things that caught my attention are..." or "Here's what stands out to me...")

⚠️ **Things to Note**: Any important considerations, risks, or interesting aspects (explain in a friendly way, like "I noticed a few things worth mentioning..." or "Here are some areas that might be interesting...")

💡 **My Thoughts**: Practical insights or suggestions based on the content (give advice like a knowledgeable friend, using "I'd suggest..." or "You might want to consider...")

📋 **Summary**: A conversational wrap-up (like "In a nutshell..." or "The bottom line is...")

Document Content:
${text}

Please provide your analysis in a natural, conversational tone - as if you're explaining this to a friend who asked for your expert opinion:`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: this.contextSize,
          num_gpu: this.gpuLayers,
          temperature: 0.6,        // More natural and conversational
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_predict: 2000        // Allow longer conversational analysis
        }
      });

      return {
        analysis: response.response,
        timestamp: new Date().toISOString(),
        model: this.model
      };
    } catch (error) {
      console.error('❌ Error analyzing document:', error);
      throw error;
    }
  }

  // Load all user's contracts into vector store for RAG
  async loadUserDocuments(userId) {
    try {
      const { supabase } = require('../config/supabase');
      
      // Get all completed contracts for the user
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, content, file_name, title')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('content', 'is', null);

      if (error) {
        console.error('❌ Error fetching user contracts:', error);
        return false;
      }

      if (!contracts || contracts.length === 0) {
        console.log('📄 No completed contracts found for RAG');
        return false;
      }

      // Convert contracts to document format
      const documents = contracts.map(contract => ({
        pageContent: contract.content,
        metadata: {
          contractId: contract.id,
          fileName: contract.file_name,
          title: contract.title || contract.file_name,
          userId: userId
        }
      }));

      // Clear existing vector store and recreate with all user documents
      console.log(`🧠 Loading ${contracts.length} contracts into vector store for RAG`);
      await this.createVectorStore(documents);
      
      console.log(`✅ Vector store loaded with ${contracts.length} contracts`);
      return true;
    } catch (error) {
      console.error('❌ Error loading user documents into vector store:', error);
      return false;
    }
  }

  // Get vector store statistics
  getVectorStoreStats() {
    try {
      if (!this.vectorStore) {
        return { documentsCount: 0, status: 'not initialized' };
      }
      // MemoryVectorStore doesn't have direct access to document count
      // but we can infer it's working if it exists
      return { status: 'initialized', type: 'memory' };
    } catch (error) {
      console.error('❌ Error getting vector store stats:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Warm up models for faster processing
  async warmupModels() {
    if (this.modelsWarmedUp) return true;
    
    try {
      console.log('🔥 Warming up AI models...');
      // Simple prompt to load models into memory
      await this.ollama.generate({
        model: this.model,
        prompt: 'Hello',
        options: {
          num_predict: 1,
          temperature: 0.1
        }
      });
      
      this.modelsWarmedUp = true;
      console.log('✅ Models warmed up successfully');
      return true;
    } catch (error) {
      console.error('❌ Model warmup failed:', error);
      return false;
    }
  }

  // Faster document analysis optimized for batch processing
  async analyzeDocumentFast(content, userId) {
    try {
      console.log(`🤖 [User: ${userId}] Fast analyzing document...`);
      
      const prompt = `Analyze this contract quickly and provide key insights in JSON format:

${content.substring(0, 4000)} ${content.length > 4000 ? '...(truncated for speed)' : ''}

Provide a JSON response with:
- contractType: brief type classification
- keyTerms: array of 3-5 most important terms
- riskLevel: "low", "medium", "high"
- mainConcerns: array of 2-3 key concerns
- summary: 2-sentence summary

Respond only with valid JSON.`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        options: {
          num_predict: 300, // Limit response length for speed
          temperature: 0.1, // Lower temperature for consistency
          top_p: 0.8,
          num_ctx: this.contextSize
        }
      });

      // Parse JSON response
      try {
        const analysis = JSON.parse(response.response);
        console.log(`✅ [User: ${userId}] Fast analysis completed`);
        return {
          ...analysis,
          processingTime: new Date().toISOString(),
          mode: 'fast'
        };
      } catch (parseError) {
        console.warn('❌ JSON parse failed, falling back to text analysis');
        return {
          contractType: 'Unknown',
          summary: response.response.substring(0, 200),
          riskLevel: 'medium',
          keyTerms: ['Legal Document'],
          mainConcerns: ['Requires manual review'],
          processingTime: new Date().toISOString(),
          mode: 'fallback'
        };
      }

    } catch (error) {
      console.error(`❌ [User: ${userId}] Fast document analysis failed:`, error);
      throw error;
    }
  }

  // Add documents with user isolation
  async addDocumentsWithIsolation(documents, userId) {
    try {
      console.log(`🧠 [User: ${userId}] Adding documents with isolation...`);
      
      // Get or create user-specific vector store
      let userVectorStore = this.userVectorStores.get(userId);
      if (!userVectorStore) {
        const splits = await this.textSplitter.splitDocuments(
          documents.map(doc => new Document(doc))
        );
        userVectorStore = await MemoryVectorStore.fromDocuments(splits, this.embeddings);
        this.userVectorStores.set(userId, userVectorStore);
        console.log(`✅ [User: ${userId}] Created new isolated vector store`);
      } else {
        // Add to existing store
        const splits = await this.textSplitter.splitDocuments(
          documents.map(doc => new Document(doc))
        );
        await userVectorStore.addDocuments(splits);
        console.log(`✅ [User: ${userId}] Added to existing vector store`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ [User: ${userId}] Error adding documents with isolation:`, error);
      throw error;
    }
  }

  // Get user-specific vector store
  getUserVectorStore(userId) {
    return this.userVectorStores.get(userId);
  }

  // Clean up user vector stores (call periodically or on user logout)
  cleanupUserVectorStore(userId) {
    if (this.userVectorStores.has(userId)) {
      this.userVectorStores.delete(userId);
      console.log(`🧹 [User: ${userId}] Vector store cleaned up`);
      return true;
    }
    return false;
  }

  // Get processing statistics
  getProcessingStats() {
    return {
      activeUserStores: this.userVectorStores.size,
      modelsWarmedUp: this.modelsWarmedUp,
      users: Array.from(this.userVectorStores.keys())
    };
  }

  // Get quick platform information
  getPlatformInfo() {
    return {
      appName: APPLICATION_KNOWLEDGE.appInfo.name,
      description: APPLICATION_KNOWLEDGE.appInfo.description,
      version: APPLICATION_KNOWLEDGE.appInfo.version,
      keyFeatures: APPLICATION_KNOWLEDGE.features.core.slice(0, 5), // Top 5 features
      supportedFormats: APPLICATION_KNOWLEDGE.features.supported_formats,
      aiModels: APPLICATION_KNOWLEDGE.technical_specs.ai_models,
      privacyInfo: APPLICATION_KNOWLEDGE.policies.privacy.data_processing
    };
  }

  // Get frequently asked questions
  getFrequentlyAskedQuestions() {
    return APPLICATION_KNOWLEDGE.faq;
  }

  // Check if the system is optimized for the user's query type
  getOptimizationStatus(queryType = 'general') {
    return {
      platform: true, // Always optimized for platform queries
      document: !!this.vectorStore, // Optimized if vector store is available
      general: true, // Always available for general queries
      currentQueryType: queryType
    };
  }
}

// Create and export singleton instance
const ollamaService = new OllamaService();

module.exports = {
  ollamaService,
  OllamaService
};