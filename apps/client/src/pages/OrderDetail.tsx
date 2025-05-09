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
  price: number;
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

        console.log('Order Data:', data.order);
        console.log('Service User ID:', data.order.service?.user?.id);
        
        setOrder(data.order);

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
        console.log('Current User ID:', currentUserId);

        // Check if the current user is the seller by comparing with the service's user ID
        const isUserSeller = data.order.service?.user?.id === currentUserId;
        console.log('Is User Seller:', isUserSeller);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Order Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : order.status === 'accepted'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : order.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : order.status === 'in_progress'
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      : order.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Service Details</h2>
                <div className="flex items-start space-x-4">
                  <img
                    src={order.service.images[0] || 'https://via.placeholder.com/150'}
                    alt={order.service.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium">{order.service.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {order.service.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Buyer</h3>
                  <p className="mt-1">{order.buyer?.name || 'Unknown Buyer'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.buyer?.email || 'No email available'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Seller</h3>
                  <p className="mt-1">{order.seller?.name || 'Unknown Seller'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.seller?.email || 'No email available'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</h3>
                  <p className="mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                  <p className="mt-1">${order.price}</p>
                </div>
                {order.status === 'completed' && order.completedAt && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed On</h3>
                    <p className="mt-1">
                      {new Date(order.completedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Review Section - Only show for completed orders and buyers */}
              {(() => {
                console.log('Review Section Debug:', {
                  isSeller,
                  orderStatus: order.status,
                  hasReview: order.hasReview,
                  shouldShowReview: !isSeller && order.status === 'completed' && !order.hasReview
                });
                return !isSeller && order.status === 'completed' && !order.hasReview && (
                  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Leave a Review</h2>
                    {showReviewForm ? (
                      <ReviewForm
                        serviceId={order.service.id}
                        orderId={order.id}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-[#1DBF73] text-white px-6 py-3 rounded-lg hover:bg-[#19a463] transition-colors font-medium"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Show review status if review exists */}
              {(() => {
                console.log('Review Status Debug:', {
                  isSeller,
                  orderStatus: order.status,
                  hasReview: order.hasReview,
                  shouldShowStatus: !isSeller && order.status === 'completed' && order.hasReview
                });
                return !isSeller && order.status === 'completed' && order.hasReview && (
                  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Your Review</h2>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-300">
                        You have already submitted a review for this order.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="mt-6">
                {isSeller ? (
                  // Seller Actions
                  <>
                    {order.status === 'pending' && (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleStatusUpdate('accepted')}
                          className="flex-1 bg-[#1DBF73] text-white px-4 py-2 rounded-lg hover:bg-[#19a463] transition-colors"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('rejected')}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Reject Order
                        </button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusUpdate('in_progress')}
                        className="w-full bg-[#1DBF73] text-white px-4 py-2 rounded-lg hover:bg-[#19a463] transition-colors"
                      >
                        Start Working
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        className="w-full bg-[#1DBF73] text-white px-4 py-2 rounded-lg hover:bg-[#19a463] transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </>
                ) : (
                  // Buyer Actions
                  <>
                    {order.status === 'pending' && (
                      <button
                        onClick={handleCancel}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Messages</h2>
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
                          ? 'bg-[#1DBF73] text-white'
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
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DBF73]"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !message.trim()}
                  className="bg-[#1DBF73] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Add any additional information or actions here */}
          </div>
        </div>

        {/* Payment Modal */}
        {!isSeller && order.status === 'accepted' && order.paymentStatus === 'pending' && (
          <div className="mt-8">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#1DBF73] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#19a463] transition-colors"
            >
              Make Payment
            </button>
          </div>
        )}

        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={order.price}
            orderId={order.id}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}
      </div>
    </div>
  );
};

export default OrderDetail; 