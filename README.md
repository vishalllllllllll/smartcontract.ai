# 🤖 SmartContract.ai

> **AI-Powered Contract Intelligence Platform** - Upload, analyze, and chat with your legal documents using local AI models. No external API costs!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16-green.svg)
![React](https://img.shields.io/badge/react-18-61DAFB.svg)
![AI](https://img.shields.io/badge/AI-Ollama%20Local-orange.svg)

SmartContract.ai is an AI-powered contract intelligence platform that enables users to upload legal documents and interact with them through an intelligent chatbot. The platform extracts, analyzes, and provides insights from contract documents using advanced RAG (Retrieval-Augmented Generation) technology powered by **local Ollama models**.

## 🌟 Key Highlights

- 🔒 **100% Local AI Processing** - No external API costs, data stays private
- 📄 **Multi-Format Support** - PDFs, images, Word docs with advanced OCR
- 💬 **Interactive RAG Chat** - Natural language queries about your contracts
- ⚡ **Real-time Processing** - Live updates and notifications
- 🔐 **Secure & Private** - JWT auth, encrypted storage, local AI inference
- 🎯 **Optimized for RTX 3050** - Efficient models for consumer hardware

## ✨ Features

### 📋 Document Processing
- **Multi-Format Support**: PDFs, Word docs, images (JPG, PNG, TIFF), and text files
- **Drag & Drop Interface**: Modern, intuitive file upload experience
- **Advanced OCR Pipeline**: Tesseract.js + AI cleanup for perfect text extraction
- **Real-time Status**: Live processing updates and notifications

### 🤖 AI Intelligence
- **Local Ollama Models**: llama3.2:3b + nomic-embed-text (optimized for RTX 3050)
- **RAG System**: Context-aware question answering about your documents
- **Risk Analysis**: Automatic contract risk assessment and key term extraction
- **No API Costs**: Everything runs locally - completely free AI processing

### 🔐 Security & Performance
- **JWT Authentication**: Secure user sessions and data protection
- **Supabase Backend**: Modern PostgreSQL database with real-time features
- **Socket.IO**: Real-time notifications and live updates
- **Responsive UI**: Beautiful Tailwind CSS interface that works on all devices

## Architecture

### Frontend (React.js)
- **Framework**: React 18 with modern hooks
- **Styling**: Tailwind CSS for responsive UI
- **State Management**: React Context API
- **Routing**: React Router for navigation
- **File Upload**: React Dropzone for drag-and-drop functionality
- **Icons**: Lucide React

### Backend (Node.js + Express)
- **Framework**: Express.js with security middleware
- **Database**: Supabase (PostgreSQL) for modern database features
- **Authentication**: JWT-based with bcrypt password hashing
- **File Processing**: Multer for file uploads
- **API Documentation**: RESTful API with validation

### AI Processing (Local Ollama)
- **Text Generation**: llama3.2:3b optimized for RTX 3050 4GB VRAM
- **Embeddings**: nomic-embed-text for vector search
- **OCR**: Tesseract.js for image text extraction
- **Vector Storage**: In-memory vector store for document search
- **RAG System**: Context-aware question answering

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** and npm
- **Supabase account** (free tier available)
- **Ollama installed** locally
- **8GB+ RAM** recommended for AI models

### 1️⃣ Install Ollama & Models

```bash
# Download from https://ollama.ai
# Windows: Download installer from website
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models (optimized for RTX 3050 4GB VRAM)
ollama pull llama3.2:3b
ollama pull nomic-embed-text

# Start Ollama service
ollama serve
```

### 2️⃣ Clone & Setup Project

```bash
git clone https://github.com/YOUR_USERNAME/smartcontract-ai.git
cd smartcontract-ai

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3️⃣ Setup Supabase Database

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings > API** to get your URL and keys
4. Run the SQL commands from `SUPABASE_SETUP.sql` in your Supabase SQL Editor

### 4️⃣ Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET (generate a secure random string)
```

### 5️⃣ Start the Application

```bash
# Terminal 1: Start backend (port 5002)
cd server
npm start

# Terminal 2: Start frontend (port 3000)
npm start
```

### 6️⃣ Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002
- **Health Check**: http://localhost:5002/health

> 🎉 **That's it!** Upload a contract and start chatting with your documents!

## Environment Configuration

### 🔧 Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

```bash
# Database - Get from Supabase Dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security - Generate secure random string
JWT_SECRET=your-super-secure-jwt-secret-here

# AI Models - Optimized for RTX 3050 (4GB VRAM)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Server Settings
PORT=5002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional: Email notifications
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Contracts
- `POST /api/contracts/upload` - Upload and process contract
- `GET /api/contracts` - Get user contracts
- `GET /api/contracts/:id` - Get specific contract
- `DELETE /api/contracts/:id` - Delete contract

### Chat & RAG
- `POST /api/chat/query` - Send query to RAG system
- `GET /api/chat/sessions/:contractId` - Get chat history

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Health & Monitoring
- `GET /health` - System health check (Supabase + Ollama status)

## Database Schema (Supabase)

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Contracts Table
```sql
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  analysis JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Features

### Advanced OCR Pipeline
1. **Image Preprocessing**: Sharp.js optimization (grayscale, normalize, sharpen)
2. **Text Extraction**: Tesseract.js OCR processing
3. **AI Enhancement**: Ollama cleans up OCR errors and improves formatting
4. **Quality Scoring**: Automatic confidence assessment

### RAG System
1. **Document Chunking**: Intelligent text splitting with overlap
2. **Vector Embeddings**: nomic-embed-text for semantic search
3. **Similarity Search**: Find relevant document sections
4. **Context-Aware Responses**: llama3.2:3b generates fast, accurate answers

### Risk Analysis
- Pattern-based risk detection
- AI-powered comprehensive analysis
- Severity scoring and recommendations
- Key term extraction

## Performance Optimization

### For RTX 3050 (4GB VRAM)
- **Model**: llama3.2:3b (optimized for 4GB VRAM, faster inference)
- **Context Length**: Optimized chunk sizes
- **Memory Management**: Efficient vector storage
- **Batch Processing**: Smart document processing

### Hardware Requirements
- **Minimum**: 8GB RAM, 4GB VRAM
- **Recommended**: 16GB+ RAM, 6GB+ VRAM
- **Storage**: 10GB+ free space for models

## Development

### Project Structure
```
smartcontract_ai/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── contexts/          # React contexts
│   └── services/          # API services
├── server/                # Node.js backend
│   ├── config/           # Configuration (Supabase)
│   ├── routes/           # API routes
│   ├── services/         # Business logic (Ollama)
│   └── server.js         # Main server file
├── SETUP.md              # Detailed setup guide
└── README.md            # This file
```

### Available Scripts

**Frontend:**
- `npm start` - Development server
- `npm run build` - Production build

**Backend:**
- `npm run dev` - Development server with auto-reload
- `npm start` - Production server
- `npm run test-setup` - Test Supabase + Ollama connection

## Deployment

### Local Development
1. Follow the Quick Start guide
2. Ensure Ollama is running: `ollama serve`
3. Check health endpoint for service status

### Production Deployment
1. **Database**: Supabase Pro for production workloads
2. **AI Processing**: Deploy with GPU support for better performance
3. **Models**: Consider larger models (13B, 32B) for better accuracy
4. **Monitoring**: Set up health checks and logging

## Troubleshooting

### Common Issues

**Ollama Not Running:**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve
```

**Models Missing:**
```bash
# Pull required models (RTX 3050 optimized)
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

**Supabase Connection Issues:**
- Verify URL and API key in `.env`
- Check that database tables are created
- Ensure RLS policies are configured

**Memory Issues:**
- Use smaller context windows
- Process documents in smaller chunks
- Monitor RAM usage during processing

## 🎯 What Makes This Special

### 💰 Zero API Costs
- **No OpenAI/Claude charges** - Everything runs locally with Ollama
- **Free Supabase tier** - 500MB database, generous limits
- **Consumer Hardware Optimized** - Works great on RTX 3050 (4GB VRAM)

### 🛡️ Privacy & Security
- **Local AI Processing** - Your documents never leave your machine
- **End-to-end Encryption** - Secure JWT authentication
- **Open Source** - Full transparency, no vendor lock-in

### ⚡ Performance
- **Real-time Chat** - Instant responses via Socket.IO
- **Smart PDF Viewer** - Multiple fallback methods for universal compatibility
- **Efficient OCR** - Tesseract.js + AI cleanup for perfect text extraction

## 📱 Screenshots

*[Add screenshots of your application here when available]*

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **🐛 Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/smartcontract-ai/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/smartcontract-ai/discussions)
- **📧 Email**: smartcontractai2025@gmail.com

### Common Issues

- **Health Check**: Visit `/health` endpoint for system status
- **Model Issues**: Ensure Ollama is running (`ollama serve`)
- **Database Issues**: Verify Supabase configuration in `.env`

## ⭐ Star History

If this project helped you, please consider giving it a star! It helps others discover the project.

---

**🚀 Built with ❤️ using local AI - No external API costs, maximum privacy!**