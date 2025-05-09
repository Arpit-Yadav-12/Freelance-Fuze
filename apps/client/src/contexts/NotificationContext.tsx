import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import io, { Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const initializeSocket = async () => {
      const token = await getToken();
      if (!token) return;

      const newSocket = io(import.meta.env.VITE_WS_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    };

    initializeSocket();
  }, [getToken]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [getToken]);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 