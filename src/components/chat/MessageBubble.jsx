import React from 'react';
import { Bot, User, ExternalLink, AlertCircle } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-primary-600 text-white' 
          : message.isError 
            ? 'bg-red-100 text-red-600'
            : 'bg-primary-100 text-primary-600'
      }`}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : message.isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`rounded-xl p-4 ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : message.isError
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Sources */}
          {message.sources && message.sources.length > 0 && !isUser && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-medium">Sources:</p>
              <div className="space-y-1">
                {message.sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600 truncate">
                      Page {source.page || index + 1}: {source.text?.substring(0, 60)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;