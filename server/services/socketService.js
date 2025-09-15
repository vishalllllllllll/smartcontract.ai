const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socket ID -> userId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware for Socket.IO
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Query user from Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();
        
        if (error || !user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.IO service initialized');
    return this.io;
  }

  handleConnection(socket) {
    const userId = socket.userId;
    console.log(`🔌 User ${userId} connected via socket ${socket.id}`);

    // Track user connections
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time notifications',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Handle client events
    socket.on('subscribe_processing', (contractId) => {
      socket.join(`contract_${contractId}`);
      console.log(`📝 User ${userId} subscribed to contract ${contractId} processing updates`);
    });

    socket.on('unsubscribe_processing', (contractId) => {
      socket.leave(`contract_${contractId}`);
      console.log(`📝 User ${userId} unsubscribed from contract ${contractId} processing updates`);
    });

    socket.on('mark_notification_read', async (notificationId) => {
      try {
        // Update notification in Supabase
        const { error } = await supabase
          .from('notifications')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', notificationId)
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error marking notification as read:', error);
          return;
        }
        
        socket.emit('notification_marked_read', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    socket.on('get_online_status', () => {
      const onlineCount = this.userSockets.size;
      socket.emit('online_status', { onlineUsers: onlineCount });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  handleDisconnection(socket, reason) {
    const userId = socket.userId;
    console.log(`🔌 User ${userId} disconnected: ${reason}`);

    // Clean up tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    this.io.to(`user_${userId}`).emit('new_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send processing updates to subscribers
  sendProcessingUpdate(contractId, userId, update) {
    this.io.to(`contract_${contractId}`).emit('processing_update', {
      contractId,
      userId,
      ...update,
      timestamp: new Date().toISOString()
    });

    // Also send to user's personal room
    this.io.to(`user_${userId}`).emit('contract_status_update', {
      contractId,
      ...update,
      timestamp: new Date().toISOString()
    });
  }

  // Send chat message updates
  sendChatUpdate(contractId, userId, message) {
    this.io.to(`user_${userId}`).emit('new_chat_message', {
      contractId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast system-wide notifications
  broadcastSystemNotification(notification) {
    this.io.emit('system_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send real-time analytics updates
  sendAnalyticsUpdate(userId, analytics) {
    this.io.to(`user_${userId}`).emit('analytics_update', {
      ...analytics,
      timestamp: new Date().toISOString()
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  // Get user's active connections
  getUserConnections(userId) {
    return this.userSockets.get(userId) || new Set();
  }

  // Send typing indicator for chat
  sendTypingIndicator(contractId, userId, isTyping) {
    this.io.to(`contract_${contractId}`).emit('user_typing', {
      contractId,
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  // Send user activity updates
  sendUserActivity(userId, activity) {
    this.io.to(`user_${userId}`).emit('user_activity', {
      activity,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = {
  socketService,
  SocketService
};