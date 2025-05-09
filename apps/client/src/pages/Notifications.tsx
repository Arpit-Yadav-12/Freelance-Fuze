import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredNotifications = notifications
    .filter((notification) => (filter === 'unread' ? !notification.read : true))
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'order_created':
      case 'order_updated':
      case 'order_completed':
      case 'order_cancelled':
        return `/orders/${notification.data.orderId}`;
      case 'message_received':
        return `/chat?userId=${notification.data.userId}`;
      default:
        return '#';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            <p className="text-lg">No notifications yet</p>
            <p className="mt-2">You'll be notified when you receive new messages or order updates.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
              <button
                onClick={clearNotifications}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Clear all
              </button>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                  className={`block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="ml-4 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications; 