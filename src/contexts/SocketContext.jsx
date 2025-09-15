import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const initializeSocket = useCallback(() => {
    if (!token) {
      console.log('🔌 No token available, skipping socket connection');
      return;
    }

    const socketURL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5002';
    console.log('🔌 Attempting to connect to socket server at:', socketURL);
    
    const newSocket = io(socketURL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      forceNew: true,
      timeout: 20000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      setConnected(true);
      setSocket(newSocket);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      setConnected(false);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.current += 1;
          newSocket.connect();
        }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      console.error('🔌 Error details:', error.message, error.description, error.context, error.type);
      setConnected(false);
    });

    // Real-time notification events
    newSocket.on('new_notification', (notification) => {
      console.log('🔔 New notification:', notification);
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'SmartContract.ai', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id
        });
      }
      
      // Play sound if enabled (you can add this based on user settings)
      playNotificationSound();
    });

    // Processing updates
    newSocket.on('processing_update', (update) => {
      console.log('⚙️ Processing update:', update);
      // You can dispatch this to your app context or state management
    });

    newSocket.on('contract_status_update', (update) => {
      console.log('📄 Contract status update:', update);
      // Handle contract status changes
    });

    // Chat updates
    newSocket.on('new_chat_message', (message) => {
      console.log('💬 New chat message:', message);
      // Handle new chat messages
    });

    // System notifications
    newSocket.on('system_notification', (notification) => {
      console.log('🔔 System notification:', notification);
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    // Analytics updates
    newSocket.on('analytics_update', (analytics) => {
      console.log('📊 Analytics update:', analytics);
      // Handle real-time analytics updates
    });

    // User activity updates
    newSocket.on('user_activity', (activity) => {
      console.log('👤 User activity:', activity);
      // Handle user activity notifications
    });

    // Online status
    newSocket.on('online_status', ({ onlineUsers: count }) => {
      setOnlineUsers(count);
    });

    // Connection confirmation
    newSocket.on('connected', (data) => {
      console.log('✅ Connection confirmed:', data);
    });
  }, [token]);

  useEffect(() => {
    if (user && token) {
      initializeSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token, initializeSocket]);

  const playNotificationSound = () => {
    try {
      // You can add an audio file for notifications
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      // Ignore audio errors
    }
  };

  // Socket methods
  const subscribeToContract = (contractId) => {
    if (socket && connected) {
      socket.emit('subscribe_processing', contractId);
    }
  };

  const unsubscribeFromContract = (contractId) => {
    if (socket && connected) {
      socket.emit('unsubscribe_processing', contractId);
    }
  };

  const markNotificationRead = (notificationId) => {
    if (socket && connected) {
      socket.emit('mark_notification_read', notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    }
  };

  const getOnlineStatus = () => {
    if (socket && connected) {
      socket.emit('get_online_status');
    }
  };

  const sendTypingIndicator = (contractId, isTyping) => {
    if (socket && connected) {
      socket.emit('typing_indicator', { contractId, isTyping });
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    notifications,
    
    // Methods
    subscribeToContract,
    unsubscribeFromContract,
    markNotificationRead,
    getOnlineStatus,
    sendTypingIndicator,
    requestNotificationPermission,
    clearNotifications,
    removeNotification,
    
    // Utils
    playNotificationSound
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};