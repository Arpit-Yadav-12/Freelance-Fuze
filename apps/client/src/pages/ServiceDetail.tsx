import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
  features: string[];
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  packages: Package[];
  user: {
    id: string;
    name: string;
    email: string;
    profile: {
      bio: string;
      location: string;
    } | null;
  };
}

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/services/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service');
        }
        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid service data received');
        }

        // Ensure the service has the required properties
        if (!data.packages || !Array.isArray(data.packages)) {
          data.packages = [];
        }

        // Ensure user object exists with required properties
        if (!data.user) {
          data.user = {
            id: '',
            name: 'Unknown User',
            email: '',
            profile: null
          };
        }

        console.log('Service data:', data); // Debug log

        setService(data);
        if (data.packages.length > 0) {
          setSelectedPackage(data.packages[0]);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      navigate('/sign-in');
      return;
    }

    if (!selectedPackage) {
      setError('Please select a package');
      return;
    }

    setOrderLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service?.id,
          packageId: selectedPackage.id,
          totalAmount: selectedPackage.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DBF73] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Service not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Service Images */}
            <div className="space-y-4">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={service.images[0] || 'https://via.placeholder.com/800x450'}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {service.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {service.images.slice(1).map((image, index) => (
                    <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={image}
                        alt={`${service.title} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {service.title}
                </h1>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${service.user?.name || 'Unknown'}`}
                        alt={service.user?.name || 'Unknown User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {service.user?.name || 'Unknown User'}
                      </p>
                      {service.user?.profile?.location && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          📍 {service.user.profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </div>

              {/* Packages */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select a Package
                </h2>
                <div className="space-y-4">
                  {service.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-6 rounded-lg border transition-colors ${
                        selectedPackage?.id === pkg.id
                          ? 'border-[#1DBF73] bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#1DBF73]/50'
                      } cursor-pointer`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {pkg.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {pkg.description}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-[#1DBF73]">
                          ${pkg.price}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                          >
                            <svg
                              className="w-4 h-4 text-[#1DBF73] mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Button */}
              <div className="pt-6">
                {user && service?.user && user.id !== service.user.id && (
                  <button
                    onClick={handleOrder}
                    disabled={orderLoading || !selectedPackage}
                    className="w-full bg-[#1DBF73] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {orderLoading ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail; 