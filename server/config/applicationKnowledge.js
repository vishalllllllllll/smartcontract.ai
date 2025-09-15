// SmartContract.ai Application Knowledge Base
// This contains comprehensive information about the application's policies, features, and usage

const APPLICATION_KNOWLEDGE = {
  appInfo: {
    name: "SmartContract.ai",
    description: "An AI-powered contract intelligence platform for document analysis and interaction",
    version: "1.0.0",
    architecture: "React frontend + Node.js backend + local Ollama AI",
    purpose: "Upload legal documents and interact with them through intelligent chatbot using RAG technology"
  },

  features: {
    core: [
      "Document Upload & Processing (PDF, Word, Images, Text)",
      "AI-Powered Contract Analysis using local Ollama models",
      "Advanced OCR with Tesseract.js + AI cleanup",
      "Interactive RAG Chat for document queries",
      "Real-time Processing with live status updates",
      "Secure User Management & Authentication",
      "Local AI Processing (no external API costs)",
      "Modern responsive UI with Tailwind CSS"
    ],

    ai_capabilities: [
      "Contract risk assessment and analysis",
      "Key terms extraction and identification",
      "Context-aware question answering",
      "Semantic document search using vector embeddings",
      "OCR enhancement for scanned documents",
      "Multi-document RAG for comprehensive insights",
      "Natural language document interaction"
    ],

    supported_formats: [
      "PDF documents",
      "Microsoft Word files (.doc, .docx)",
      "Images (JPG, PNG, TIFF, etc.) with OCR",
      "Plain text files",
      "Scanned documents through OCR processing"
    ]
  },

  policies: {
    privacy: {
      data_processing: "All AI processing happens locally using Ollama - no data sent to external APIs",
      data_storage: "Documents stored securely in Supabase database",
      user_data: "User authentication data is encrypted and hashed",
      local_ai: "Complete privacy with local AI models - no external API calls for document analysis"
    },

    usage_limits: {
      file_size: "Maximum file size: 10MB per upload",
      file_types: "Supported: PDF, DOC, DOCX, JPG, PNG, TIFF, TXT",
      processing: "Documents processed sequentially for optimal performance",
      storage: "Uses Supabase free tier (500MB database, 50MB file storage)"
    },

    terms_of_service: {
      purpose: "Platform designed for legal document analysis and contract intelligence",
      responsibility: "Users responsible for ensuring they have rights to upload documents",
      accuracy: "AI analysis is advisory only - not legal advice",
      data_retention: "Documents stored until user deletion or account termination"
    },

    security: {
      authentication: "JWT-based authentication with bcrypt password hashing",
      access_control: "Users can only access their own documents",
      api_security: "Rate limiting and input validation on all endpoints",
      local_processing: "Sensitive document content never leaves your local environment"
    }
  },

  technical_specs: {
    ai_models: {
      text_generation: "llama3.2:3b (optimized for RTX 3050 4GB VRAM)",
      embeddings: "nomic-embed-text for vector search and RAG",
      ocr: "Tesseract.js for image text extraction",
      context_size: "8192 tokens (configurable up to 128K for Llama 3.2)",
      gpu_optimization: "32 GPU layers for RTX 3050 acceleration"
    },

    performance: {
      typical_response: "2-5 seconds for document queries",
      processing_time: "Varies by document size and complexity",
      memory_usage: "Optimized for 8GB+ RAM systems",
      gpu_requirements: "4GB+ VRAM recommended for optimal performance"
    },

    system_requirements: {
      minimum: "8GB RAM, 4GB VRAM, 10GB storage",
      recommended: "16GB+ RAM, 6GB+ VRAM, SSD storage",
      os_support: "Windows, macOS, Linux (via Ollama)",
      dependencies: "Node.js 16+, Ollama, Supabase account"
    }
  },

  user_guide: {
    getting_started: [
      "Create an account using the registration form",
      "Log in to access your personal dashboard",
      "Upload documents using the drag-and-drop interface",
      "Wait for AI processing to complete (status updates provided)",
      "Start chatting with your documents using natural language"
    ],

    best_practices: [
      "Upload clear, high-quality document scans for better OCR results",
      "Use specific questions for more accurate AI responses",
      "Break complex queries into smaller, focused questions",
      "Review AI analysis as advisory information, not legal advice",
      "Keep documents organized with descriptive titles"
    ],

    troubleshooting: [
      "If processing is slow, ensure Ollama is running locally",
      "For OCR issues, try higher resolution document scans",
      "Clear browser cache if experiencing UI issues",
      "Check health endpoint (/health) for system status",
      "Ensure all required Ollama models are installed"
    ]
  },

  api_endpoints: {
    authentication: [
      "POST /api/auth/register - User registration",
      "POST /api/auth/login - User authentication",
      "POST /api/auth/forgot-password - Password reset request",
      "POST /api/auth/reset-password - Password reset with token",
      "GET /api/auth/profile - User profile information"
    ],

    document_management: [
      "POST /api/contracts/upload - Upload and process documents",
      "GET /api/contracts - List user's documents",
      "GET /api/contracts/:id - Get specific document",
      "DELETE /api/contracts/:id - Delete document",
      "GET /api/contracts/:id/analysis - Get AI analysis"
    ],

    chat_and_rag: [
      "POST /api/chat/query - Send questions to AI (with or without document context)",
      "GET /api/chat/sessions/:contractId - Get chat history for document",
      "DELETE /api/chat/sessions/:sessionId - Clear chat session"
    ],

    system: [
      "GET /health - System health check (Supabase + Ollama status)",
      "GET /api/notifications - User notifications",
      "PUT /api/notifications/:id/read - Mark notification as read"
    ]
  },

  faq: {
    general: [
      {
        question: "What is SmartContract.ai?",
        answer: "SmartContract.ai is an AI-powered platform that lets you upload legal documents and chat with them using advanced AI. It provides contract analysis, risk assessment, and natural language interaction with your documents."
      },
      {
        question: "How does the AI work?",
        answer: "We use local Ollama AI models (llama3.2:3b) for text generation and nomic-embed-text for document search. Everything runs locally on your machine for complete privacy."
      },
      {
        question: "Is my data private?",
        answer: "Yes! All AI processing happens locally using Ollama. Your documents never leave your environment for AI analysis. We use Supabase for secure document storage."
      },
      {
        question: "What file types are supported?",
        answer: "We support PDF, Word documents, images (with OCR), and text files. Maximum file size is 10MB."
      }
    ],

    technical: [
      {
        question: "What hardware do I need?",
        answer: "Minimum: 8GB RAM, 4GB VRAM. Recommended: 16GB+ RAM, 6GB+ VRAM. The system is optimized for RTX 3050 and similar GPUs."
      },
      {
        question: "How fast is document processing?",
        answer: "Typical response time is 2-5 seconds for queries. Initial document processing depends on size and complexity but provides real-time status updates."
      },
      {
        question: "Can I use this offline?",
        answer: "The AI processing works offline once Ollama models are installed. You need internet for user authentication and document storage via Supabase."
      }
    ],

    usage: [
      {
        question: "How do I get the best results?",
        answer: "Upload clear, high-quality documents, ask specific questions, and break complex queries into smaller parts. The AI works best with well-structured documents."
      },
      {
        question: "Is the AI analysis legally binding?",
        answer: "No, our AI analysis is advisory only and should not be considered legal advice. Always consult qualified legal professionals for legal matters."
      },
      {
        question: "Can I analyze multiple documents together?",
        answer: "Yes! Our RAG system can search across all your uploaded documents to provide comprehensive insights and cross-document analysis."
      }
    ]
  },

  contact_and_support: {
    health_check: "Visit /health endpoint to check system status",
    documentation: "Comprehensive setup guides available in README.md and QUICK_SETUP_GUIDE.md",
    troubleshooting: "Check application logs and Ollama status for technical issues",
    community: "Open source project - contribute on GitHub"
  }
};

module.exports = { APPLICATION_KNOWLEDGE };