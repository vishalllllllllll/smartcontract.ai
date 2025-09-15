import React from 'react';
import { X, Info, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NotificationPanel = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useApp();
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    // Format as "Sep 2, 10:35 AM"
    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.isRead).forEach(notification => {
      markNotificationRead(notification.id);
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }
  };

  return (
    <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Bell className="h-4 w-4 text-white flex-shrink-0" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={unreadCount === 0}
          >
            Mark all read ({unreadCount})
          </button>
          <button
            onClick={clearAllNotifications}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group p-4 cursor-pointer transition-all duration-200 ${
                  !notification.isRead 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-gray-100 hover:to-gray-100 border-l-4 border-gray-400' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-sm leading-5 ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 font-medium">
                        {formatTime(notification.createdAt)}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(notification.id);
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Mark as read"
                  >
                    <X className="h-3 w-3 text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;