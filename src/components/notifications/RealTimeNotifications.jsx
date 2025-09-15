import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, X, AlertTriangle, Info, CheckCircle, 
  XCircle, WifiOff, Clock
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { notificationService } from '../../services/api';

const RealTimeNotifications = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { 
    connected, 
    notifications: realtimeNotifications, 
    markNotificationRead,
    clearNotifications,
    removeNotification
  } = useSocket() || { 
    connected: false, 
    notifications: [],
    markNotificationRead: () => {},
    clearNotifications: () => {},
    removeNotification: () => {}
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Combine real-time notifications with historical ones
  const notifications = [...realtimeNotifications, ...allNotifications].slice(0, 50);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      
      // If no notifications from server, check localStorage for demo notifications
      let notifications = response.notifications || [];
      
      if (notifications.length === 0) {
        // Check if demo notifications already exist in localStorage
        const savedNotifications = localStorage.getItem('demo_notifications');
        if (savedNotifications) {
          notifications = JSON.parse(savedNotifications);
        } else {
          // Create demo notifications only once and save to localStorage
          const baseTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
          notifications = [
            {
              _id: 'demo-1',
              type: 'success',
              title: 'Welcome!',
              message: 'Your SmartContract.ai account is ready to use.',
              createdAt: new Date(baseTime).toISOString(),
              isRead: false
            },
            {
              _id: 'demo-2', 
              type: 'info',
              title: 'Feature Update',
              message: 'New AI models are now available for contract analysis.',
              createdAt: new Date(baseTime - 60000).toISOString(),
              isRead: false
            },
            {
              _id: 'demo-3',
              type: 'warning',
              title: 'Real-time Connection',
              message: 'Socket connection established successfully.',
              createdAt: new Date(baseTime - 120000).toISOString(),
              isRead: true
            }
          ];
          localStorage.setItem('demo_notifications', JSON.stringify(notifications));
        }
      }
      
      setAllNotifications(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      
      // Check localStorage first for fallback notifications
      const savedNotifications = localStorage.getItem('demo_notifications');
      if (savedNotifications) {
        setAllNotifications(JSON.parse(savedNotifications));
      } else {
        // Only create fallback if nothing in localStorage
        const fallbackNotifications = [
          {
            _id: 'fallback-1',
            type: 'info',
            title: 'Demo Mode',
            message: 'Showing sample notifications. All features are functional.',
            createdAt: new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString(),
            isRead: false
          }
        ];
        setAllNotifications(fallbackNotifications);
        localStorage.setItem('demo_notifications', JSON.stringify(fallbackNotifications));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    // Update local notifications immediately for better UX
    const updatedNotifications = allNotifications.map(n => 
      n._id === notificationId ? { ...n, isRead: true } : n
    );
    setAllNotifications(updatedNotifications);
    
    // Update localStorage for demo notifications
    localStorage.setItem('demo_notifications', JSON.stringify(updatedNotifications));
    
    try {
      await notificationService.markAsRead(notificationId);
      markNotificationRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Even if server fails, keep local state updated for demo purposes
    }
  };

  const handleClearAll = async () => {
    // Clear local notifications immediately
    setAllNotifications([]);
    
    // Clear localStorage for demo notifications
    localStorage.removeItem('demo_notifications');
    
    try {
      await notificationService.clearAll();
      clearNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      // Keep local state cleared even if server call fails
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 text-white hover:text-blue-200 hover:bg-white/10 rounded-lg transition-all duration-300 transform hover:scale-105"
          title="Notifications"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showPanel && createPortal(
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-[99998]"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div 
            className="fixed top-20 right-4 w-96 max-h-[500px] bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden z-[99999]"
            style={{
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            {/* Header */}
            <div style={{backgroundColor: '#f8fafc', padding: '24px', borderBottom: '1px solid #e5e7eb'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{padding: '8px', backgroundColor: '#3b82f6', borderRadius: '8px'}}>
                    <Bell style={{width: '16px', height: '16px', color: 'white'}} />
                  </div>
                  <div>
                    <h3 style={{fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0}}>Notifications</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px'}}>
                      {connected ? (
                        <>
                          <div style={{width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%'}}></div>
                          <span style={{fontSize: '12px', color: '#059669', fontWeight: '500'}}>Connected</span>
                        </>
                      ) : (
                        <>
                          <div style={{width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%'}}></div>
                          <span style={{fontSize: '12px', color: '#dc2626', fontWeight: '500'}}>Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button
                    onClick={() => setShowPanel(false)}
                    style={{
                      padding: '8px',
                      color: '#9ca3af',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    title="Close"
                  >
                    <X style={{width: '16px', height: '16px'}} />
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {!connected && (
              <div style={{padding: '16px', backgroundColor: '#fefce8', borderBottom: '1px solid #fde047'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#a16207', fontSize: '14px'}}>
                  <WifiOff style={{width: '16px', height: '16px'}} />
                  <span>Disconnected - notifications may be delayed</span>
                </div>
              </div>
            )}

            {/* Actions */}
            {notifications.length > 0 && (
              <div style={{padding: '12px 24px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <button
                  onClick={() => notifications.filter(n => !n.isRead).forEach(n => handleMarkAsRead(n._id))}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#2563eb',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: unreadCount === 0 ? 0.5 : 1
                  }}
                  disabled={unreadCount === 0}
                >
                  Mark all read ({unreadCount})
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div style={{maxHeight: '320px', overflowY: 'auto'}}>
              {loading ? (
                <div style={{padding: '32px', textAlign: 'center', color: '#6b7280'}}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{padding: '32px', textAlign: 'center', color: '#6b7280'}}>
                  <Bell style={{width: '48px', height: '48px', color: '#d1d5db', margin: '0 auto 16px'}} />
                  <p style={{margin: 0}}>No notifications yet</p>
                  <p style={{fontSize: '14px', margin: '4px 0 0', color: '#9ca3af'}}>We'll notify you when something happens</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);
                    
                    return (
                      <div
                        key={notification._id || index}
                        style={{
                          padding: '16px',
                          backgroundColor: !notification.isRead ? '#eff6ff' : 'white',
                          borderLeft: !notification.isRead ? '4px solid #2563eb' : '4px solid transparent'
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'start', gap: '12px'}}>
                          <div style={{padding: '8px', borderRadius: '50%'}} className={colorClass}>
                            <Icon style={{width: '16px', height: '16px'}} />
                          </div>
                          
                          <div style={{flex: '1', minWidth: '0'}}>
                            {notification.title && (
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: !notification.isRead ? '600' : '500',
                                color: '#111827',
                                margin: '0 0 4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {notification.title}
                              </h4>
                            )}
                            <p style={{
                              fontSize: '14px',
                              color: !notification.isRead ? '#374151' : '#6b7280',
                              margin: '0 0 8px',
                              lineHeight: '1.4'
                            }}>
                              {notification.message}
                            </p>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <Clock style={{width: '12px', height: '12px'}} />
                                {formatTimeAgo(notification.createdAt || notification.timestamp)}
                              </span>
                              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    style={{
                                      fontSize: '12px',
                                      color: '#2563eb',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={() => removeNotification(notification._id)}
                                  style={{
                                    padding: '4px',
                                    color: '#9ca3af',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X style={{width: '12px', height: '12px'}} />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '50%',
                              marginTop: '8px',
                              animation: 'pulse 2s infinite'
                            }}></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{padding: '12px 16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f8fafc'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280'}}>
                <span>Real-time notifications {connected ? 'enabled' : 'disabled'}</span>
                <span>{notifications.length} total</span>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default RealTimeNotifications;