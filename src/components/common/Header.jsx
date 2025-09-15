import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Upload, LogOut, User, Edit3, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UploadModal from '../upload/UploadModal';
import RealTimeNotifications from '../notifications/RealTimeNotifications';
import ProfileModal from '../profile/ProfileModal';

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">SmartContract.ai</span>
              <p className="text-sm text-gray-300">AI-Powered Contract Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Contract</span>
            </button>

            {/* Real-time Notifications */}
            <RealTimeNotifications />

            {/* User Menu */}
            <div className="relative z-[9999]" ref={userMenuRef}>
              <button
                onClick={() => {
                  console.log('User menu button clicked, current state:', showUserMenu);
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-300" />
              </button>

              {showUserMenu && (
                <div 
                  className="fixed right-4 top-16 w-48 bg-gray-800 rounded-lg border border-gray-600 py-2 shadow-2xl z-[9999]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-gray-600">
                    <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit Profile clicked');
                      handleOpenProfile();
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-3" />
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Sign Out clicked');
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-300 hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
};

export default Header;