const express = require('express');
const { ollamaService } = require('../services/ollamaService');

const router = express.Router();

// @route   GET /api/health/ollama
// @desc    Check Ollama service health
// @access  Public
router.get('/ollama', async (req, res) => {
  try {
    console.log('🔍 Checking Ollama service health...');
    
    const health = await ollamaService.checkHealth();
    
    res.json({
      message: 'Ollama health check completed',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   POST /api/health/test-chat
// @desc    Test Ollama chat functionality
// @access  Public (for testing)
router.post('/test-chat', async (req, res) => {
  try {
    const { message = 'Hello, how are you?' } = req.body;
    
    console.log(`🤖 Testing Ollama chat with message: "${message}"`);
    
    const response = await ollamaService.answerQuestion(message);
    
    res.json({
      message: 'Ollama chat test successful',
      query: message,
      response: response.answer,
      hasContext: response.hasContext,
      model: ollamaService.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ollama chat test error:', error);
    res.status(500).json({
      message: 'Ollama chat test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;