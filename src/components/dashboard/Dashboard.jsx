import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, Upload, TrendingUp, MessageCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Header from '../common/Header';
import StatsCard from './StatsCard';
import ContractList from './ContractList';
import UploadModal from '../upload/UploadModal';
import ChatInterface from '../chat/ChatInterface';

const Dashboard = () => {
  const { stats, loading, contracts } = useApp();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGeneralChat, setShowGeneralChat] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with adjusted styles for dark theme */}
      <Header />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-24 min-h-0">
        {/* Page Header */}
        <div className={`mb-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
              Contract Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Manage and analyze your contracts with AI-powered insights. 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-semibold">
              {' '}100% secure and private.
            </span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <StatsCard
            icon={FileText}
            title="Total Contracts"
            count={stats.total}
            color="blue"
            gradient="from-blue-500 to-purple-600"
          />
          <StatsCard
            icon={CheckCircle}
            title="Completed"
            count={stats.completed}
            color="green"
            gradient="from-green-500 to-teal-600"
          />
          <StatsCard
            icon={Clock}
            title="Processing"
            count={stats.processing}
            color="yellow"
            gradient="from-yellow-500 to-orange-600"
          />
          <StatsCard
            icon={AlertTriangle}
            title="High Risk"
            count={stats.highRisk}
            color="red"
            gradient="from-red-500 to-pink-600"
          />
        </div>

        {/* Quick Actions */}
        {contracts.length === 0 && !loading && (
          <div className={`mb-8 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div 
              className="p-12 rounded-3xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Welcome to SmartContract.ai!</h3>
                <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                  Start by uploading your first contract to experience our AI-powered analysis and insights.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Your First Contract</span>
                  <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract List */}
        {loading ? (
          <div className={`flex items-center justify-center py-12 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div 
              className="p-8 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-white text-center">Loading your contracts...</p>
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <ContractList />
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {showGeneralChat && (
        <ChatInterface 
          contract={{ 
            id: 'general',
            fileName: 'AI Assistant',
            file_name: 'AI Assistant'
          }}
          onClose={() => setShowGeneralChat(false)}
          isGeneralChat={true}
        />
      )}

      <button
        onClick={() => setShowGeneralChat(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110 z-40 flex items-center justify-center group cursor-pointer"
        title="Chat with AI Assistant"
      >
        <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
        
        {/* Tooltip */}
        <div className="absolute right-20 bottom-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          Chat with AI
        </div>
      </button>

    </div>
  );
};

export default Dashboard;