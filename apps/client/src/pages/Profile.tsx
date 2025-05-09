import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import SellerStats from '../components/SellerStats';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  category: string;
  images: string[];
}

interface Profile {
  id: string;
  userId: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  socialLinks: any;
  skills: string[];
  hourlyRate: number | null;
  category: string | null;
  portfolio: string | null;
  experience: string | null;
  education: string | null;
  averageRating: number;
  totalReviews: number;
  completedGigs: number;
  trophyLevel: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  profile: Profile | null;
}

const Profile: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch profile data
        const profileResponse = await fetch('http://localhost:5000/api/seller/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        setProfileData(profileData.user);

        // Fetch services if user is a seller
        if (profileData.user.role === 'seller') {
          const servicesResponse = await fetch('http://localhost:5000/api/seller/services', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!servicesResponse.ok) {
            throw new Error('Failed to fetch services');
          }

          const servicesData = await servicesResponse.json();
          setServices(servicesData.services);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const handleDeleteService = async (serviceId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      // Remove the deleted service from the state
      setServices(services.filter(service => service.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DBF73] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                  <img
                    src={user?.imageUrl || 'https://via.placeholder.com/150'}
                    alt={user?.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.fullName || 'User'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress || 'No email'}</p>
                <span className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                  {profileData?.role || 'Buyer'}
                </span>
                {profileData?.role === 'seller' && profileData?.profile && (
                  <div className="mt-4">
                    <SellerStats
                      averageRating={profileData.profile.averageRating}
                      totalReviews={profileData.profile.totalReviews}
                      completedGigs={profileData.profile.completedGigs}
                      trophyLevel={profileData.profile.trophyLevel}
                      showDetails={true}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'profile'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile Information
                </button>
                {profileData?.role === 'seller' && (
                  <>
                    <Link
                      to="/list-service"
                      className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      List a Service
                    </Link>
                    <button
                      className={`w-full text-left px-4 py-2 rounded-lg ${
                        activeTab === 'services'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveTab('services')}
                    >
                      My Services
                    </button>
                  </>
                )}
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'security'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData?.name || ''}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData?.email || ''}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        readOnly
                      />
                    </div>
                    {profileData?.profile && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profileData.profile.bio || ''}
                          rows={4}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'services' && profileData?.role === 'seller' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">My Services</h3>
                    <Link
                      to="/list-service"
                      className="px-4 py-2 text-sm font-medium text-white bg-[#1DBF73] border border-transparent rounded-md hover:bg-[#19a463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DBF73]"
                    >
                      Create New Service
                    </Link>
                  </div>

                  {services.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">You haven't created any services yet.</p>
                      <Link
                        to="/list-service"
                        className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-[#1DBF73] border border-transparent rounded-md hover:bg-[#19a463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DBF73]"
                      >
                        Create Your First Service
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div key={service.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{service.title}</h4>
                            <div className="flex space-x-2">
                              <Link
                                to={`/edit-service/${service.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 dark:text-green-400 font-semibold">${service.price}</span>
                            <span className="text-gray-500 dark:text-gray-400">{service.deliveryTime} days delivery</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your account is secured with Clerk authentication. You can manage your security settings through your Clerk dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 