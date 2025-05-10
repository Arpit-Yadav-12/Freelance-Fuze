import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import PaymentModal from '../components/PaymentModal';
import ReviewForm from '../components/ReviewForm';

interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalAmount: number;
  service: {
    id: string;
    title: string;
    description: string;
    images: string[];
    user: {
      id: string;
    };
  };
  seller: {
    id: string;
    name: string;
    imageUrl: string;
    email: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }[];
  hasReview: boolean;
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        
        if (!data || !data.order) {
          throw new Error('Invalid order data received');
        }

        // Log the order data for debugging
        console.log('Order Data:', data.order);
        
        // Ensure all required fields are present
        const orderData = {
          ...data.order,
          service: data.order.service || null,
          seller: data.order.seller || null,
          buyer: data.order.buyer || null,
          totalAmount: data.order.totalAmount || 0,
        };

        setOrder(orderData);

        // Get the current user's ID from the authenticated user data
        const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        const currentUserId = userData.user.id;
        
        // Check if the current user is the seller by comparing with the service's user ID
        const isUserSeller = orderData.service?.user?.id === currentUserId;
        setIsSeller(isUserSeller);
      } catch (error) {
        setError('Failed to load order details');
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, getToken]);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Always fetch the complete order data after status update
      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to fetch updated order');
      }

      const orderData = await orderResponse.json();
      setOrder(orderData.order);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const handleCancel = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/orders/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setOrder(prev => prev ? {
        ...prev,
        messages: [...prev.messages, data.message],
      } : null);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Refresh order data to show updated payment status
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error refreshing order:', error);
      setError('Failed to refresh order');
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      // Add validation checks
      if (order?.status !== 'completed') {
        throw new Error('You can only review completed orders');
      }

      if (order?.paymentStatus !== 'paid') {
        throw new Error('Payment must be completed before submitting a review');
      }

      console.log('Review submission debug:', {
        token: token.substring(0, 20) + '...', // Log first 20 chars of token
        url: `${import.meta.env.VITE_API_URL}/reviews`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: {
          serviceId: order?.service.id,
          orderId: order?.id,
          rating,
          comment,
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: order?.service.id,
          orderId: order?.id,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Review submission error:', error);
        throw new Error(error.message || 'Failed to submit review');
      }

      setShowReviewForm(false);
      // Refresh order data to show updated review status
      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to fetch updated order');
      }

      const data = await orderResponse.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DBF73]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : order ? (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Order #{order.id}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Created on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(order.totalAmount || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Payment Status: {order.paymentStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Service and User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Service Details</h2>
              <div className="space-y-4">
                {order.service ? (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{order.service.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{order.service.description}</p>
                    </div>
                    {order.service.images && order.service.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {order.service.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Service ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Service information not available</p>
                )}
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Seller</h3>
                  {order.seller ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">{order.seller.name || 'Name not available'}</p>
                      <p className="text-gray-500 dark:text-gray-400">{order.seller.email || 'Email not available'}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Seller information not available</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Buyer</h3>
                  {order.buyer ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">{order.buyer.name || 'Name not available'}</p>
                      <p className="text-gray-500 dark:text-gray-400">{order.buyer.email || 'Email not available'}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Buyer information not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status and Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Order Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-900 dark:text-white">
                  Current Status: <span className="font-medium">{order.status}</span>
                </div>
                {order.paymentStatus === 'pending' && !isSeller && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Make Payment
                  </button>
                )}
              </div>

              {/* Seller Actions */}
              {isSeller && (
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleStatusUpdate('accepted')}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('rejected')}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject Order
                      </button>
                    </div>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Start Working
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              )}

              {/* Buyer Actions */}
              {!isSeller && (
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={handleCancel}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.status === 'completed' && !order.hasReview && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Write a Review
                    </button>
                  )}
                  {order.status === 'completed' && order.hasReview && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      You have already submitted a review for this order
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Messages Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Messages</h2>
            <div className="space-y-4 mb-6">
              {order.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender.id === order.buyer.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      msg.sender.id === order.buyer.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={msg.sender.imageUrl || 'https://via.placeholder.com/32'}
                        alt={msg.sender.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{msg.sender.name}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-75">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No messages yet
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={sendingMessage || !message.trim()}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Payment Modal */}
      {showPaymentModal && order && (
        <PaymentModal
          isOpen={showPaymentModal}
          amount={order.totalAmount || 0}
          orderId={order.id}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Review Form Modal */}
      {showReviewForm && order && (
        <ReviewForm
          serviceId={order.service.id}
          orderId={order.id}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default OrderDetail; 