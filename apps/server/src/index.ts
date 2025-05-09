import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import orderRoutes from './routes/orderRoutes';
import messageRoutes from './routes/messageRoutes';
import reviewRoutes from './routes/reviewRoutes';
import transactionRoutes from './routes/transactionRoutes';
import chatRoutes from './routes/chatRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import sellerRoutes from './routes/sellerRoutes';
import path from 'path';
import uploadRoutes from './routes/uploadRoutes';
import notificationRoutes from './routes/notificationRoutes';
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('Fiverr Clone API');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          orderId: data.orderId,
          userId: data.userId,
        },
      });
      io.to(data.roomId).emit('receive_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 