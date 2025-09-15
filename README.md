# SmartContract.ai

SmartContract.ai is an AI-powered contract intelligence platform that enables users to upload legal documents and interact with them through an intelligent chatbot. The platform extracts, analyzes, and provides insights from contract documents using advanced RAG (Retrieval-Augmented Generation) technology powered by local Ollama models.

## Features

- **Document Upload & Processing**: Support for PDF, Word, images, and text files with drag-and-drop interface
- **AI-Powered Analysis**: Automatic extraction of key terms, risk assessment, and contract insights using local Ollama models
- **Advanced OCR**: Extract and enhance text from images using Tesseract.js + AI cleanup
- **Interactive RAG Chat**: Natural language queries about contract content with context-aware responses
- **Real-time Processing**: Live status updates and notifications during document analysis
- **User Management**: Secure authentication and user dashboard
- **Local AI Processing**: No external API costs - everything runs locally with Ollama
- **Modern UI**: Responsive design with Tailwind CSS

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

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier available)
- Ollama installed locally
- 8GB+ RAM recommended for Ollama models

### Installation

1. **Install Ollama:**
   ```bash
   # Download from https://ollama.ai or use package manager
   # Windows: Download installer
   # macOS: brew install ollama
   # Linux: curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull required models (optimized for RTX 3050 4GB)
   ollama pull llama3.2:3b
   ollama pull nomic-embed-text
   ```

2. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd smartcontract_ai
   
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up Supabase:**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings > API to get your URL and anon key
   - Run the SQL commands from `SETUP.md` in your Supabase SQL Editor

4. **Configure environment:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Test your setup:**
   ```bash
   cd server
   npm run test-setup
   ```

6. **Start the servers:**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

7. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key

# Ollama Configuration (optimized for RTX 3050)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CONTEXT_SIZE=4096
OLLAMA_GPU_LAYERS=32

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/tiff,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
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

## Cost Savings

- **No OpenAI API costs** - Everything runs locally
- **Free Supabase tier** - 500MB database, 50MB file storage
- **Efficient Processing** - Optimized for consumer hardware
- **Scalable** - Upgrade models/hardware as needed

## License

MIT License - see LICENSE file for details.

## Support

- **Setup Issues**: Check `SETUP.md` for detailed instructions
- **Health Check**: Visit `/health` endpoint for system status
- **Model Issues**: Ensure Ollama is running and models are pulled
- **Database Issues**: Verify Supabase configuration

---

**Built with ❤️ using local AI - no external API costs!**