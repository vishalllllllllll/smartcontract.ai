import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Cloud, Upload, FileText, File, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { contractService } from '../../services/api';

const UploadModal = ({ onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { addContract, addNotification } = useApp();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({
        type: 'error',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({
        type: 'error',
        message: 'Only PDF, Word documents, text files, and images are supported'
      });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const result = await contractService.uploadContract(file);
      
      // Add contract to context with proper structure
      const contractData = {
        _id: result.contract?.id || result.id,
        id: result.contract?.id || result.id,
        title: result.contract?.title || file.name,
        file_name: result.contract?.fileName || file.name,
        fileName: result.contract?.fileName || file.name,
        status: 'processing',
        uploadDate: new Date().toISOString(),
        created_at: new Date().toISOString(),
        fileSize: file.size,
        file_size: file.size,
        content: null,
        extractedText: null
      };
      
      addContract(contractData);
      
      // Show success notification
      addNotification({
        type: 'success',
        message: `✅ "${file.name}" uploaded! AI analysis starting...`
      });
      
      setUploadStatus({
        type: 'success',
        message: '🚀 Upload complete! AI is now processing your document...'
      });
      
      // Close modal after a shorter delay since processing is fast
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  }, [addContract, addNotification, onClose]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const getDropzoneClasses = () => {
    let classes = "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ";
    
    if (isDragAccept) {
      classes += "border-green-400 bg-green-50";
    } else if (isDragReject) {
      classes += "border-red-400 bg-red-50";
    } else if (isDragActive) {
      classes += "border-primary-400 bg-primary-50";
    } else {
      classes += "border-gray-300 hover:border-primary-400 hover:bg-primary-50";
    }
    
    return classes;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Contract</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Subtitle */}
          <p className="text-gray-600">Upload a document for AI analysis</p>

          {/* Upload Area */}
          <div {...getRootProps()} className={getDropzoneClasses()}>
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                  ) : (
                    <Cloud className="h-6 w-6 text-primary-600" />
                  )}
                </div>
              </div>
              
              {uploading ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">📤 Uploading contract...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500">Processing will begin automatically after upload</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-gray-700 font-medium">
                      {isDragActive ? 'Drop your document here' : 'Drag and drop your document here'}
                    </p>
                    <p className="text-sm text-gray-500">or click to browse from your computer</p>
                  </div>
                  
                  <button className="btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Browse Files
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              uploadStatus.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{uploadStatus.message}</span>
            </div>
          )}

          {/* Supported Formats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Supported Formats</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>PDF Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4" />
                <span>Word Documents</span>
              </div>
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4" />
                <span>Text Files</span>
              </div>
              <div className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span>Images (JPG, PNG, TIFF, etc.)</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">Max 10MB</p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3">What Happens Next</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>AI will extract and analyze document text (OCR for images)</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Risk analysis and metrics calculation</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Interactive RAG chatbot for Q&A</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Comprehensive analytics dashboard</span>
              </li>
            </ul>
          </div>

          {/* Footer Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => document.querySelector('input[type="file"]').click()}
              className="flex-1 btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;