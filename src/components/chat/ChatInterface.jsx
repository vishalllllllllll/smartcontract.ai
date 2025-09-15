import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, FileText, Trash2, X } from 'lucide-react';
import { chatService } from '../../services/api';
import MessageBubble from './MessageBubble';

const ChatInterface = ({ contract, onClose, isGeneralChat = false }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    try {
      if (!isGeneralChat) {
        const history = await chatService.getChatHistory(contract._id);
        if (history && history.messages && history.messages.length > 0) {
          setMessages(history.messages);
          return;
        }
      }
      
      // Add welcome message for new chats or general chat
      const welcomeMessage = isGeneralChat 
        ? `Hi! I'm your AI assistant. I can help you with contract analysis, legal questions, document understanding, and general assistance. How can I help you today?`
        : `Hi! I'm here to help you analyze "${contract.title || contract.file_name || contract.fileName}". You can ask me questions about the contract content, key terms, potential risks, or anything else you'd like to understand.`;
        
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        sources: []
      }]);
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Add welcome message on error
      const welcomeMessage = isGeneralChat 
        ? `Hi! I'm your AI assistant. How can I help you today?`
        : `Hi! I'm here to help you analyze "${contract.title || contract.file_name || contract.fileName}". You can ask me questions about the contract content, key terms, potential risks, or anything else you'd like to understand.`;
        
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        sources: []
      }]);
    }
  }, [contract._id, contract.fileName, isGeneralChat]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      sources: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const contractId = isGeneralChat ? null : (contract._id || contract.id);
      const response = await chatService.sendQuery(contractId, inputMessage.trim(), sessionId);
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        timestamp: new Date(),
        sources: [],
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear this chat session?')) {
      try {
        await chatService.clearChatSession(sessionId);
        setMessages([{
          id: 'welcome-new',
          role: 'assistant',
          content: `Hi! I'm here to help you analyze "${contract.title || contract.file_name || contract.fileName}". You can ask me questions about the contract content, key terms, potential risks, or anything else you'd like to understand.`,
          timestamp: new Date(),
          sources: []
        }]);
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isGeneralChat ? 'AI Assistant' : 'Contract Analysis'}
              </h2>
              <p className="text-sm text-gray-600 truncate max-w-md">
                {isGeneralChat ? 'General AI Assistant' : (contract.title || contract.file_name || contract.fileName)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-xl p-4 max-w-md">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isGeneralChat ? "Ask me anything..." : "Ask a question about this contract..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none min-h-[50px] max-h-32"
                rows="1"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;