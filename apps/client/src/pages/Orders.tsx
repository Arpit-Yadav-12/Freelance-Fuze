import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface Order {
  id: string;
  service: {
    id: string;
    title: string;
    images: string[];
  };
  package: {
    id: string;
    name: string;
    price: number;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  buyer: {
    id: string;
    fullName: string;
    imageUrl: string;
  };
  seller: {
    id: string;
    fullName: string;
    imageUrl: string;
  };
  isSeller: boolean;
}

type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        setError('Failed to load orders. Please try again later.');
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getToken]);

  const handleCancelClick = (orderId: string) => {
    setCancellingOrderId(orderId);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingOrderId) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/${cancellingOrderId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === cancellingOrderId
            ? { ...order, status: 'cancelled' }
            : order
        )
      );
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setShowCancelDialog(false);
      setCancellingOrderId(null);
    }
  };

  const handleCancelCancel = () => {
    setShowCancelDialog(false);
    setCancellingOrderId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'active':
        return orders.filter(order => 
          ['pending', 'accepted', 'in_progress'].includes(order.status)
        );
      case 'completed':
        return orders.filter(order => order.status === 'completed');
      case 'cancelled':
        return orders.filter(order => 
          ['cancelled', 'rejected'].includes(order.status)
        );
      default:
        return orders;
    }
  };

  const getTabCount = (tab: OrderTab) => {
    switch (tab) {
      case 'active':
        return orders.filter(order => 
          ['pending', 'accepted', 'in_progress'].includes(order.status)
        ).length;
      case 'completed':
        return orders.filter(order => order.status === 'completed').length;
      case 'cancelled':
        return orders.filter(order => 
          ['cancelled', 'rejected'].includes(order.status)
        ).length;
      default:
        return orders.length;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DBF73]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Orders</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-4 px-2 ${
            activeTab === 'all'
              ? 'border-b-2 border-[#1DBF73] text-[#1DBF73]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#1DBF73]'
          }`}
        >
          All Orders
          <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
            {getTabCount('all')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 ${
            activeTab === 'active'
              ? 'border-b-2 border-[#1DBF73] text-[#1DBF73]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#1DBF73]'
          }`}
        >
          Active Orders
          <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
            {getTabCount('active')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-4 px-2 ${
            activeTab === 'completed'
              ? 'border-b-2 border-[#1DBF73] text-[#1DBF73]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#1DBF73]'
          }`}
        >
          Completed Orders
          <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
            {getTabCount('completed')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`pb-4 px-2 ${
            activeTab === 'cancelled'
              ? 'border-b-2 border-[#1DBF73] text-[#1DBF73]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#1DBF73]'
          }`}
        >
          Cancelled Orders
          <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
            {getTabCount('cancelled')}
          </span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {getFilteredOrders().length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'all'
                ? 'No orders found.'
                : activeTab === 'active'
                ? 'No active orders.'
                : activeTab === 'completed'
                ? 'No completed orders.'
                : 'No cancelled orders.'}
            </p>
          </div>
        ) : (
          getFilteredOrders().map(order => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <img
                    src={order.service.images[0] || 'https://via.placeholder.com/150'}
                    alt={order.service.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link
                        to={`/services/${order.service.id}`}
                        className="hover:text-[#1DBF73]"
                      >
                        {order.service.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Package: {order.package.name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Price: ${order.package.price}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ordered on: {formatDate(order.createdAt)}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-4">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-[#1DBF73] hover:text-[#19a463]"
                  >
                    View Details
                  </Link>
                  {order.status === 'pending' && !order.isSeller && (
                    <button
                      onClick={() => handleCancelClick(order.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 