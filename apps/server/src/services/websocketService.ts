import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

const prisma = new PrismaClient();

interface Notification {
  id: string;
  type: 'order_created' | 'order_cancelled' | 'order_completed' | 'order_updated';
  message: string;
  data: any;
  createdAt: Date;
  read: boolean;
}

class WebSocketService {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      try {
        const session = await clerkClient.sessions.verifySession(token);
        const userId = session.userId;

        // Store socket connection for user
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, []);
        }
        this.userSockets.get(userId)?.push(socket.id);

        // Join user's room
        socket.join(userId);

        // Handle disconnection
        socket.on('disconnect', () => {
          const userSockets = this.userSockets.get(userId);
          if (userSockets) {
            const index = userSockets.indexOf(socket.id);
            if (index > -1) {
              userSockets.splice(index, 1);
            }
            if (userSockets.length === 0) {
              this.userSockets.delete(userId);
            }
          }
        });
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        socket.disconnect();
      }
    });
  }

  async createNotification(userId: string, notification: Omit<Notification, 'id' | 'read'>) {
    try {
      // Create notification in database
      const newNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          message: notification.message,
          data: notification.data,
          read: false,
        },
      });

      // Send notification to user's room
      this.io.to(userId).emit('notification', newNotification);

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          read: true,
        },
      });

      this.io.to(userId).emit('notification_updated', notification);
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async getUnreadNotifications(userId: string) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          read: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }
}

export default WebSocketService; 