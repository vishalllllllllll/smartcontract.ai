require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit'); // Removed for free usage

// Import Supabase and Ollama services
const { supabase, testConnection, initializeTables } = require('./config/supabase');
const { ollamaService } = require('./services/ollamaService');

// Import routes
const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const healthRoutes = require('./routes/health');

// Import services
const { socketService } = require('./services/socketService');

// Initialize Express app
const app = express();

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

// Set port
const PORT = process.env.PORT || 5000;

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      message: 'Validation error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      error: 'DUPLICATE_KEY'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  
  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Rate limiting removed for free usage

// Middleware setup
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting removed for free usage

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const dbConnected = await testConnection();
    const dbStatus = dbConnected ? 'connected' : 'disconnected';
    
    // Check Ollama service
    const ollamaHealth = await ollamaService.checkHealth();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbStatus,
          provider: 'Supabase',
          host: process.env.SUPABASE_URL ? 'configured' : 'not configured'
        },
        aiService: {
          status: ollamaHealth.status,
          provider: 'Ollama',
          mainModel: ollamaHealth.mainModel,
          embeddingModel: ollamaHealth.embeddingModel,
          ollamaRunning: ollamaHealth.ollamaRunning
        }
      }
    };
    
    const overallStatus = dbConnected && ollamaHealth.ollamaRunning ? 200 : 503;
    res.status(overallStatus).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.baseUrl} not found`,
    availableRoutes: {
      auth: '/api/auth',
      contracts: '/api/contracts',
      chat: '/api/chat',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      settings: '/api/settings',
      health: '/health'
    }
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

// Supabase connection setup
const connectDB = async () => {
  try {
    // Test Supabase connection
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Failed to connect to Supabase');
    }
    
    console.log('✅ Supabase connected successfully');
    
    // Initialize database tables
    await initializeTables();
    
    console.log('✅ Supabase tables initialized');
    
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    throw error;
  }
};

// Initialize AI services
const initializeAI = async () => {
  try {
    // Check Ollama health
    const health = await ollamaService.checkHealth();
    
    if (!health.ollamaRunning) {
      console.warn('⚠️ Ollama is not running. Some AI features will be unavailable.');
      console.warn('💡 To enable AI features, please start Ollama and install models:');
      console.warn('   ollama pull llama3.1:8b');
      console.warn('   ollama pull nomic-embed-text');
      return false;
    }
    
    // Ensure required models are available
    await ollamaService.ensureModels();
    
    console.log('✅ Ollama AI service initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing AI services:', error);
    return false;
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🔄 Received shutdown signal, closing server gracefully...');
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Try to connect to database, but continue if it fails
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('⚠️ Supabase connection failed, running in demo mode without persistence');
      console.warn('🔧 To enable full functionality, configure SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    
    // Initialize AI services
    try {
      const aiReady = await initializeAI();
      if (aiReady) {
        // Make Ollama service available globally
        app.locals.ollamaService = ollamaService;
      }
    } catch (aiError) {
      console.warn('⚠️ AI services initialization failed');
    }
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 AI-powered document analysis ready`);
      console.log(`📄 Supported formats: PDF, Images (JPG, PNG, TIFF, etc.), Word docs, Text files`);
      console.log(`🤖 AI Provider: Ollama (local)`);
      console.log(`💾 Database: Supabase`);
      console.log(`🔍 Features: RAG, OCR, Document Analysis`);
    });

    // Initialize Socket.IO for real-time features
    socketService.initialize(server);
    
    // Make socket service available globally
    app.locals.socketService = socketService;
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();