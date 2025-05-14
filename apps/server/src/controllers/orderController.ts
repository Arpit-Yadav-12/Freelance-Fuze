import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import WebSocketService from '../services/websocketService';
import { updateSellerTrophy, calculateTrophyLevel } from '../utils/trophyUtils';
import { AuthenticatedRequest } from '../middleware/auth';

let wsService: WebSocketService;

export const setWebSocketService = (service: WebSocketService) => {
  wsService = service;
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let orders;
    if (user.role === 'seller') {
      // Get orders for seller's services
      orders = await prisma.order.findMany({
        where: {
          service: {
            userId: userId
          }
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          package: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Get orders for buyer
      orders = await prisma.order.findMany({
        where: {
          userId: userId
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          package: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            images: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: true
              },
            },
          },
        },
        package: true,
        Message: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: true
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        }
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the user is either the buyer or the seller
    const service = await prisma.service.findUnique({
      where: { id: order.serviceId },
      select: { userId: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (order.userId !== userId && service.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { serviceId, packageId, totalAmount } = req.body;

    if (!serviceId || !packageId || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          serviceId,
          packageId,
          totalAmount,
          status: 'pending',
          paymentStatus: 'pending'
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          package: true
        }
      });

      // Create notification for seller
      await tx.notification.create({
        data: {
          userId: newOrder.service.user.id,
          type: 'order_created',
          message: `New order received for ${newOrder.service.title}`,
          data: {
            orderId: newOrder.id,
            serviceId: newOrder.serviceId,
            packageId: newOrder.packageId
          }
        }
      });

      return newOrder;
    });

    // Send real-time notification
    if (wsService) {
      await wsService.createNotification(order.service.user.id, {
        type: 'order_created',
        message: `New order received for ${order.service.title}`,
        data: {
          orderId: order.id,
          serviceId: order.serviceId,
          packageId: order.packageId
        },
        createdAt: new Date()
      });
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get the order with service information
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the user is the seller of the service
    if (order.service.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    // Start a transaction to update order status and seller profile
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === 'completed' && { completedAt: new Date() })
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          package: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: true
            }
          }
        }
      });

      // If order is completed, update seller's completed gigs and trophy
      if (status === 'completed') {
        // Get current profile
        const profile = await tx.profile.findUnique({
          where: { userId: order.service.userId }
        });

        if (profile) {
          // Update completed gigs and calculate new trophy level
          const newCompletedGigs = (profile.completedGigs || 0) + 1;
          const newTrophyLevel = calculateTrophyLevel(newCompletedGigs);

          // Update profile
          await tx.profile.update({
            where: { userId: order.service.userId },
            data: {
              completedGigs: newCompletedGigs,
              trophyLevel: newTrophyLevel
            }
          });
        }
      }

      return updatedOrder;
    });

    // Send notification to buyer
    if (wsService) {
      wsService.createNotification(order.userId, {
        type: 'order_updated',
        message: `Your order has been ${status}`,
        data: { orderId: id, status },
        createdAt: new Date()
      });
    }

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Check if order exists and user is authorized
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only buyer can delete their own order
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this order' });
    }

    await prisma.order.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if order exists and user is authorized
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Only buyer can cancel their own order
      if (order.userId !== userId) {
        throw new Error('Not authorized to cancel this order');
      }

      // Check if order is already cancelled or completed
      if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      if (order.status === 'completed') {
        throw new Error('Cannot cancel a completed order');
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'cancelled',
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              images: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  profile: true,
                },
              },
            },
          },
          package: true,
        },
      });

      // Create notification for seller
      await tx.notification.create({
        data: {
          userId: order.service.user.id,
          type: 'order_cancelled',
          message: `Order cancelled for ${order.service.title}`,
          data: {
            orderId: order.id,
            serviceId: order.serviceId
          }
        }
      });

      return updatedOrder;
    });

    // Send real-time notification
    if (wsService) {
      await wsService.createNotification(result.service.user.id, {
        type: 'order_cancelled',
        message: `Order cancelled for ${result.service.title}`,
        data: {
          orderId: result.id,
          serviceId: result.serviceId
        },
        createdAt: new Date()
      });
    }

    res.json({ order: result });
  } catch (error) {
    console.error('Error cancelling order:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 