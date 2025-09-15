const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { ollamaService } = require('../services/ollamaService');
const { auth } = require('../middleware/auth');
const pdf = require('pdf-parse');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// @route   POST /api/contracts/upload
// @desc    Upload and process single contract
// @access  Private
router.post('/upload', [auth, upload.single('contract')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const { title } = req.body;
    const file = req.file;

    console.log(`📄 Processing upload: ${file.originalname} (${file.size} bytes)`);

    // Store the original file as base64 for now (in production, use proper file storage)
    const fileBuffer = file.buffer;
    const fileBase64 = fileBuffer.toString('base64');

    // Create initial contract record
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert([{
        user_id: req.userId,
        title: title || file.originalname,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        status: 'processing',
        file_data: fileBase64
      }])
      .select()
      .single();

    if (contractError) {
      console.error('Contract creation error:', contractError);
      return res.status(500).json({
        message: 'Error creating contract record',
        error: contractError.message
      });
    }

    // Send immediate response
    res.status(201).json({
      message: 'Contract uploaded successfully, processing started',
      contract: {
        id: contract.id,
        title: contract.title,
        fileName: contract.file_name,
        status: contract.status,
        createdAt: contract.created_at
      }
    });

    // Process the contract in the background
    processContractAsync(contract.id, file, req.userId).catch(error => {
      console.error('Background processing error:', error);
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Error uploading contract',
      error: error.message
    });
  }
});

// @route   POST /api/contracts/upload-batch
// @desc    Upload and process multiple contracts in parallel
// @access  Private
router.post('/upload-batch', [auth, upload.array('contracts', 10)], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded'
      });
    }

    console.log(`📄 Processing batch upload: ${req.files.length} files for user ${req.userId}`);

    const processedContracts = [];
    const failedUploads = [];

    // Create contract records for all files first
    for (const file of req.files) {
      try {
        const { title } = req.body;
        
        // Store the original file as base64
        const fileBuffer = file.buffer;
        const fileBase64 = fileBuffer.toString('base64');
        
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert([{
            user_id: req.userId,
            title: title || file.originalname,
            file_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
            status: 'processing',
            file_data: fileBase64
          }])
          .select()
          .single();

        if (contractError) {
          console.error('Contract creation error:', contractError);
          failedUploads.push({
            fileName: file.originalname,
            error: contractError.message
          });
          continue;
        }

        processedContracts.push({
          id: contract.id,
          title: contract.title,
          fileName: contract.file_name,
          status: contract.status,
          createdAt: contract.created_at,
          file: file
        });

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        failedUploads.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    // Send immediate response
    res.status(201).json({
      message: `Batch upload initiated: ${processedContracts.length} files processing, ${failedUploads.length} failed`,
      contracts: processedContracts.map(c => ({
        id: c.id,
        title: c.title,
        fileName: c.fileName,
        status: c.status,
        createdAt: c.createdAt
      })),
      failed: failedUploads,
      processingCount: processedContracts.length
    });

    // Process all contracts in parallel
    const processingPromises = processedContracts.map(contract => 
      processContractAsync(contract.id, contract.file, req.userId)
        .catch(error => {
          console.error(`Background processing error for ${contract.fileName}:`, error);
          return { contractId: contract.id, error: error.message };
        })
    );

    // Start parallel processing (don't wait for completion)
    Promise.allSettled(processingPromises).then(results => {
      console.log(`🎉 Batch processing completed for user ${req.userId}. Results:`, 
        results.map(r => r.status).reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}));
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({
      message: 'Error processing batch upload',
      error: error.message
    });
  }
});

// Concurrency limit for AI processing
const processingQueue = new Map(); // userId -> number of active processes
const MAX_CONCURRENT_PER_USER = 3;
const MAX_GLOBAL_CONCURRENT = 10;
let globalProcessingCount = 0;

// Background processing function with concurrency control
async function processContractAsync(contractId, file, userId) {
  // Check concurrency limits
  const userProcessing = processingQueue.get(userId) || 0;
  if (userProcessing >= MAX_CONCURRENT_PER_USER) {
    console.log(`⏳ User ${userId} hit concurrency limit, queuing contract ${contractId}`);
    // Add small delay and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return processContractAsync(contractId, file, userId);
  }

  if (globalProcessingCount >= MAX_GLOBAL_CONCURRENT) {
    console.log(`⏳ Global concurrency limit reached, queuing contract ${contractId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return processContractAsync(contractId, file, userId);
  }

  // Increment counters
  processingQueue.set(userId, userProcessing + 1);
  globalProcessingCount++;

  try {
    console.log(`🔄 [User: ${userId}] Starting processing for contract ${contractId} (Queue: ${userProcessing + 1}/${MAX_CONCURRENT_PER_USER})`);
    
    // Extract text in parallel with AI model warmup
    const [extractedText, _] = await Promise.all([
      extractTextFromFile(file),
      ollamaService.warmupModels() // Preload models while extracting text
    ]);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Could not extract sufficient text from document');
    }

    console.log(`📝 [User: ${userId}] Extracted ${extractedText.length} characters from ${file.originalname}`);

    // Process AI analysis and embeddings in parallel
    const [analysis, _embeddings] = await Promise.all([
      ollamaService.analyzeDocumentFast(extractedText, userId), // Pass userId for isolation
      processDocumentEmbeddings(contractId, extractedText, file, userId)
    ]);
    
    console.log('✅ AI analysis and embeddings completed');

    // Update contract with results
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        content: extractedText,
        analysis: analysis,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Contract update error:', updateError);
      throw updateError;
    }

    // Create success notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: 'Contract Analysis Complete',
        message: `Analysis of "${file.originalname}" has been completed successfully. You can now chat with this document.`,
        type: 'success'
      }]);

    console.log(`🎉 [User: ${userId}] Contract ${contractId} processing completed successfully`);

  } catch (processingError) {
    console.error(`❌ [User: ${userId}] Contract processing error:`, processingError);
    
    // Update contract status to failed
    await supabase
      .from('contracts')
      .update({
        status: 'failed',
        analysis: { error: processingError.message },
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    // Create error notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: 'Contract Processing Failed',
        message: `Failed to process "${file.originalname}": ${processingError.message}`,
        type: 'error'
      }]);
  } finally {
    // Cleanup: decrement counters
    const currentUserProcessing = processingQueue.get(userId) || 1;
    if (currentUserProcessing <= 1) {
      processingQueue.delete(userId);
    } else {
      processingQueue.set(userId, currentUserProcessing - 1);
    }
    globalProcessingCount = Math.max(0, globalProcessingCount - 1);
    
    console.log(`🧹 [User: ${userId}] Processing slot freed. Remaining: User(${processingQueue.get(userId) || 0}), Global(${globalProcessingCount})`);
  }
}

// Helper function to extract text from different file types
async function extractTextFromFile(file) {
  try {
    if (file.mimetype === 'application/pdf') {
      console.log('📖 Extracting text from PDF...');
      const data = await pdf(file.buffer);
      return data.text;
    } else if (file.mimetype.startsWith('image/')) {
      console.log('🔍 Processing image with OCR...');
      const ocrResult = await ollamaService.enhancedOCR(file.buffer);
      return ocrResult.enhancedText || ocrResult.rawText;
    } else {
      // Plain text or document
      return file.buffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${file.originalname}: ${error.message}`);
  }
}

// Helper function to process embeddings with user isolation
async function processDocumentEmbeddings(contractId, extractedText, file, userId) {
  try {
    console.log(`🧠 [User: ${userId}] Creating embeddings for RAG...`);
    const documents = [{
      pageContent: extractedText,
      metadata: { 
        contractId: contractId, 
        fileName: file.originalname,
        title: file.originalname,
        userId: userId // Add user isolation
      }
    }];
    
    await ollamaService.addDocumentsWithIsolation(documents, userId);
    console.log(`✅ [User: ${userId}] Vector embeddings created`);
    return true;
  } catch (error) {
    console.error(`❌ [User: ${userId}] Embedding creation failed:`, error);
    throw error;
  }
}

// @route   GET /api/contracts
// @desc    Get user's contracts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('contracts')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId);

    // Add filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);
    }

    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: contracts, error, count } = await query;

    if (error) {
      console.error('Contracts fetch error:', error);
      return res.status(500).json({
        message: 'Error fetching contracts',
        error: error.message
      });
    }

    res.json({
      contracts: contracts || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Contracts list error:', error);
    res.status(500).json({
      message: 'Error fetching contracts',
      error: error.message
    });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get specific contract
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    res.json({
      contract
    });

  } catch (error) {
    console.error('Contract fetch error:', error);
    res.status(500).json({
      message: 'Error fetching contract',
      error: error.message
    });
  }
});

// @route   DELETE /api/contracts/:id
// @desc    Delete contract
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, title, file_name')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Delete the contract (this will cascade delete chat sessions)
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (deleteError) {
      console.error('Contract deletion error:', deleteError);
      return res.status(500).json({
        message: 'Error deleting contract',
        error: deleteError.message
      });
    }

    // Clean up vector store
    try {
      ollamaService.clearDocumentStore(req.params.id);
    } catch (vectorError) {
      console.warn('Vector store cleanup error:', vectorError.message);
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: req.userId,
        title: 'Contract Deleted',
        message: `"${contract.file_name}" has been deleted successfully.`,
        type: 'info'
      }]);

    res.json({
      message: 'Contract deleted successfully'
    });

  } catch (error) {
    console.error('Contract deletion error:', error);
    res.status(500).json({
      message: 'Error deleting contract',
      error: error.message
    });
  }
});

// @route   POST /api/contracts/:id/reprocess
// @desc    Reprocess a failed contract
// @access  Private
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    if (contract.status !== 'failed') {
      return res.status(400).json({
        message: 'Can only reprocess failed contracts'
      });
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', contract.id);

    if (updateError) {
      return res.status(500).json({
        message: 'Error updating contract status',
        error: updateError.message
      });
    }

    res.json({
      message: 'Contract reprocessing started',
      contract: {
        id: contract.id,
        status: 'processing'
      }
    });

    // Note: In a full implementation, you would re-trigger the processing
    // For now, we just update the status

  } catch (error) {
    console.error('Contract reprocessing error:', error);
    res.status(500).json({
      message: 'Error reprocessing contract',
      error: error.message
    });
  }
});

// @route   GET /api/contracts/:id/view
// @desc    View contract file inline
// @access  Private
router.get('/:id/view', async (req, res) => {
  try {
    console.log(`📁 File view request for contract ${req.params.id}`);

    // Handle authentication via token query param or header
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No token provided for file view');
      return res.status(401).send('<html><body><h1>Unauthorized</h1><p>No authentication token provided</p></body></html>');
    }

    let userId;
    try {
      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log(`✅ Token verified for user ${userId}`);
    } catch (authError) {
      console.error('❌ Token verification failed:', authError.message);
      return res.status(401).send('<html><body><h1>Unauthorized</h1><p>Invalid token</p></body></html>');
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !contract) {
      console.log(`❌ Contract not found: ${req.params.id} for user ${userId}`);
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    console.log(`📄 Contract found: ${contract.file_name} (${contract.mime_type})`);

    // Return the original file for inline viewing
    if (contract.file_data) {
      const fileBuffer = Buffer.from(contract.file_data, 'base64');
      console.log(`✅ Serving file: ${contract.file_name} (${fileBuffer.length} bytes)`);

      res.setHeader('Content-Type', contract.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${contract.file_name}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Prevent caching issues
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*'); // Allow iframe embedding
      res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow framing for PDF viewing
      res.setHeader('Content-Security-Policy', "frame-ancestors *;"); // Modern CSP for frame embedding

      // PDF-specific headers for better browser support
      if (contract.mime_type === 'application/pdf') {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Transfer-Encoding', 'binary');
      }
      res.send(fileBuffer);
    } else {
      console.log(`❌ No file data available for contract ${req.params.id}`);
      return res.status(404).json({
        message: 'Contract file not available'
      });
    }

  } catch (error) {
    console.error('Contract view error:', error);
    res.status(500).json({
      message: 'Error viewing contract',
      error: error.message
    });
  }
});

// @route   GET /api/contracts/:id/download
// @desc    Download contract file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Return the original file if available
    if (contract.file_data) {
      const fileBuffer = Buffer.from(contract.file_data, 'base64');
      res.setHeader('Content-Type', contract.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${contract.file_name}"`);
      res.send(fileBuffer);
    } else if (contract.content) {
      // Fallback to extracted content as text
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.file_name || 'contract.txt'}"`);
      res.send(contract.content);
    } else {
      return res.status(404).json({
        message: 'Contract file not available'
      });
    }

  } catch (error) {
    console.error('Contract download error:', error);
    res.status(500).json({
      message: 'Error downloading contract',
      error: error.message
    });
  }
});

module.exports = router;