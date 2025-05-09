import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, Check } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'order_created':
      case 'order_cancelled':
      case 'order_completed':
      case 'order_updated':
        window.location.href = `/orders/${notification.data.orderId}`;
        break;
      default:
        break;
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return '🛍️';
      case 'order_cancelled':
        return '❌';
      case 'order_completed':
        return '✅';
      case 'order_updated':
        return '📝';
      default:
        return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 