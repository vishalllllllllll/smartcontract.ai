import React, { useState } from 'react';
import { X, Download, Eye, FileText, AlertCircle } from 'lucide-react';

const ContractViewer = ({ contract, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('🔍 ContractViewer opened with contract:', {
    id: contract?.id,
    fileName: contract?.file_name,
    mimeType: contract?.mime_type,
    status: contract?.status,
    hasContent: !!contract?.content,
    hasFileData: !!contract?.file_data
  });

  if (!contract) return null;

  const isImageFile = contract.mime_type?.startsWith('image/');
  const isPdfFile = contract.mime_type === 'application/pdf';
  const isTextFile = contract.mime_type === 'text/plain' || 
                     contract.mime_type === 'application/msword' || 
                     contract.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const getFileViewUrl = () => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002';
    return `${baseUrl}/api/contracts/${contract.id}/view?token=${encodeURIComponent(token)}`;
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${baseUrl}/api/contracts/${contract.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download contract: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.file_name || 'contract';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to download contract: ${err.message}`);
      console.error('Download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // Status messages for processing/failed files
    if (contract.status === 'processing') {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Document...</h3>
            <p className="text-gray-600 mb-4">Your document is being processed. Please wait.</p>
          </div>
        </div>
      );
    }

    if (contract.status === 'failed') {
      return (
        <div className="bg-red-50 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Processing Failed</h3>
            <p className="text-red-600 mb-4">Document processing failed. Try uploading again.</p>
          </div>
        </div>
      );
    }

    // Render actual file content based on type
    if (isPdfFile) {
      const pdfUrl = getFileViewUrl();
      return (
        <div className="bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
          {/* PDF viewer with direct display approach */}
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                PDF Document Ready
              </h3>
              <p className="text-gray-600 mb-4">
                {contract.file_name} • {Math.round((contract.file_size || 0) / 1024)} KB
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Choose how you'd like to view this PDF document:
              </p>
            </div>

            <div className="flex flex-col space-y-3 w-full max-w-md">
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                Open PDF in New Tab
              </button>
            </div>

            {/* Show extracted content if available */}
            {contract.content && (
              <div className="mt-8 w-full max-w-2xl">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Document Preview</h4>
                  <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {contract.content.substring(0, 500)}
                    {contract.content.length > 500 && '...'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isImageFile) {
      return (
        <div className="bg-white rounded-lg p-4 text-center">
          <img
            src={getFileViewUrl()}
            alt={contract.file_name}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            style={{ objectFit: 'contain' }}
            onError={() => setError('Failed to load image. The file may be processing or unavailable.')}
            onLoad={() => console.log('Image loaded successfully')}
          />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
                <button
                  onClick={handleDownload}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Download Instead
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For text files or when we have extracted content
    if (contract.content || isTextFile) {
      return (
        <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Document Content</h3>
          </div>
          <div className="prose max-w-none">
            {contract.content ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {contract.content}
              </pre>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex flex-col items-center">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-3">Original document viewing not available.</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Content has been extracted and processed for AI analysis.
                  </p>
                  <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isLoading ? 'Downloading...' : 'Download Original'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback for other file types
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {contract.title || contract.file_name}
          </h3>
          <p className="text-gray-600 mb-4">
            This file type cannot be previewed. You can download it to view.
          </p>
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Downloading...' : 'Download File'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Eye className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {contract.title || contract.file_name}
              </h2>
              <p className="text-sm text-gray-600">
                {contract.mime_type} • {Math.round((contract.file_size || 0) / 1024)} KB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {renderContent()}
        </div>

        {/* Footer with metadata */}
        {(contract.analysis || contract.status) && (
          <div className="border-t p-6 bg-gray-50">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>
                  Uploaded: {new Date(contract.created_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  contract.status === 'completed' ? 'bg-green-100 text-green-700' :
                  contract.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  contract.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {contract.status === 'completed' ? 'Analysis Complete' :
                   contract.status === 'processing' ? 'Processing' :
                   contract.status === 'failed' ? 'Failed' :
                   contract.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractViewer;