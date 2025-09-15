import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, FileText, CheckCircle, AlertTriangle, Trash2, MessageCircle, Eye, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { contractService } from '../../services/api';
import ChatInterface from '../chat/ChatInterface';
import ContractViewer from '../contract/ContractViewer';

const ContractList = () => {
  const { contracts, loadContracts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [viewMode, setViewMode] = useState('grid');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showContractViewer, setShowContractViewer] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredContracts = (contracts || []).filter(contract => {
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }

    if (!searchTerm.trim()) {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();
    const contractName = (contract.title || contract.file_name || contract.fileName || '').toLowerCase();
    const contractContent = (contract.content || contract.extractedText || '').toLowerCase();

    return contractName.includes(searchLower) ||
           contractContent.includes(searchLower) ||
           (contract.analysisResults &&
            contract.analysisResults.summary &&
            contract.analysisResults.summary.toLowerCase().includes(searchLower)) ||
           (contract.analysisResults &&
            contract.analysisResults.keyTerms &&
            contract.analysisResults.keyTerms.some(term =>
              term.toLowerCase().includes(searchLower)
            ));
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent" />;
      case 'high-risk':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'AI Processing...';
      case 'high-risk':
        return 'High Risk';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColorDark = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'high-risk':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await contractService.deleteContract(contractId);
        loadContracts();
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  const handleChatWithContract = (contract) => {
    setSelectedContract(contract);
    setShowChatInterface(true);
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setShowContractViewer(true);
  };

  const closeChatInterface = () => {
    setShowChatInterface(false);
    setSelectedContract(null);
  };

  const closeContractViewer = () => {
    setShowContractViewer(false);
    setSelectedContract(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.relative')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  if (!contracts || contracts.length === 0) {
    return null; // This is handled by the parent Dashboard component now
  }

  return (
    <div className="space-y-6 w-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-16">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts, terms, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center space-x-2 px-4 py-3 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm">
                {statusFilter === 'all' ? 'All Status' : getStatusText(statusFilter)}
              </span>
            </button>

            {showStatusDropdown && (
              <div
                className="absolute top-full left-0 mt-2 w-40 rounded-2xl border border-white/10 py-2 z-[9999] shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  All Status
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('completed');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  Completed
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('processing');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  Processing
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('high-risk');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  High Risk
                </button>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div 
            className="flex items-center border border-white/20 rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Contracts Display */}
      {filteredContracts.length === 0 ? (
        <div 
          className="text-center py-12 p-8 rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
          }}
        >
          <p className="text-gray-300">No contracts found matching your criteria.</p>
        </div>
      ) : (
        <div className={`grid gap-6 w-full ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredContracts.map((contract) => (
            <div 
              key={contract._id || contract.id} 
              className="group relative p-6 rounded-2xl border border-white/10 hover:shadow-2xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              {/* Action Buttons - Clean floating design */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewContract(contract);
                  }}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  title="View contract"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {(contract.status === 'completed' || contract.status === 'high-risk') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleChatWithContract(contract);
                    }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Chat with contract"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteContract(contract._id || contract.id);
                  }}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  title="Delete contract"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white truncate max-w-xs mb-1">
                      {contract.title || contract.file_name || contract.fileName || 'Untitled Contract'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {(() => {
                        const date = contract.uploadDate || contract.created_at;
                        if (!date || date === 'Invalid Date') {
                          return 'Just uploaded';
                        }
                        try {
                          return new Date(date).toLocaleDateString();
                        } catch (e) {
                          return 'Just uploaded';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColorDark(contract.status)}`}>
                  {getStatusIcon(contract.status)}
                  <span>{getStatusText(contract.status)}</span>
                </span>
                
                <div className="text-xs text-gray-400">
                  {contract.fileSize || contract.file_size ? Math.round((contract.fileSize || contract.file_size) / 1024) + ' KB' : 'Unknown size'}
                </div>
              </div>

              {(contract.extractedText || contract.content) && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400 line-clamp-3">
                    {(() => {
                      const content = contract.extractedText || contract.content || '';
                      const excerpt = content.substring(0, 150);
                      
                      if (searchTerm.trim()) {
                        // Highlight search term in excerpt
                        const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        const highlightedText = excerpt.replace(searchRegex, '**$1**');
                        
                        if (highlightedText.includes('**')) {
                          return (
                            <>
                              {highlightedText.split('**').map((part, i) => 
                                i % 2 === 1 ? (
                                  <span key={i} className="bg-yellow-300 text-black px-1 rounded">
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )
                              )}
                              {content.length > 150 && '...'}
                            </>
                          );
                        }
                      }
                      
                      return excerpt + (content.length > 150 ? '...' : '');
                    })()}
                  </p>
                </div>
              )}

              {/* Clean hover effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                  filter: 'none'
                }}
              ></div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Interface Modal */}
      {showChatInterface && selectedContract && (
        <ChatInterface 
          contract={selectedContract}
          onClose={closeChatInterface}
        />
      )}

      {/* Contract Viewer Modal */}
      {showContractViewer && selectedContract && (
        <ContractViewer 
          contract={selectedContract}
          onClose={closeContractViewer}
        />
      )}

    </div>
  );
};

export default ContractList;