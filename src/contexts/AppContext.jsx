import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { contractService } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    highRisk: 0
  });

  const loadContracts = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) return;
    
    try {
      if (showLoading) setLoading(true);
      let contractsData = [];
      
      try {
        contractsData = await contractService.getContracts();
        console.log('✅ Server available, loaded', contractsData.length, 'contracts');
      } catch (error) {
        console.log('❌ Server not available, no contracts will be shown');
        contractsData = [];
      }
      
      // No demo contracts - only show real uploaded contracts
      
      setContracts(contractsData);
      
      // Calculate stats
      const newStats = contractsData.reduce((acc, contract) => {
        acc.total++;
        if (contract.status === 'completed') acc.completed++;
        else if (contract.status === 'processing') acc.processing++;
        else if (contract.status === 'high-risk') acc.highRisk++;
        return acc;
      }, { total: 0, completed: 0, processing: 0, highRisk: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Provide minimal demo data even on error
      setContracts([]);
      setStats({ total: 0, completed: 0, processing: 0, highRisk: 0 });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated]);

  const addContract = (contract) => {
    setContracts(prev => [contract, ...prev]);
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      processing: prev.processing + 1
    }));
  };

  const updateContractStatus = (contractId, status) => {
    setContracts(prev => prev.map(contract => 
      contract._id === contractId ? { ...contract, status } : contract
    ));
    loadContracts(false); // Silent reload to update stats
  };

  const addNotification = (notification) => {
    setNotifications(prev => [
      {
        ...notification,
        id: Date.now(),
        isRead: false,
        createdAt: new Date()
      },
      ...prev
    ]);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadContracts(); // Initial load with loading indicator
      
      // Set up polling for processing contracts (silent background updates)
      const pollInterval = setInterval(() => {
        loadContracts(false); // Background polling without loading indicator
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, loadContracts]);

  const value = {
    contracts,
    notifications,
    stats,
    loading,
    loadContracts,
    addContract,
    updateContractStatus,
    addNotification,
    markNotificationRead,
    clearAllNotifications
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};