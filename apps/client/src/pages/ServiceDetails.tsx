import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import SellerStats from '../components/SellerStats';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

interface Service {
  id: string;
  title: string;
  description: string;
  images: string[];
  user: {
    id: string;
    name: string;
    profile: {
      averageRating: number;
      totalReviews: number;
      completedGigs: number;
      trophyLevel: string;
    };
  };
  packages: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    deliveryTime: number;
    features: string[];
  }>;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
}

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceDetails();
    fetchReviews();
  }, [id, currentPage]);

  const fetchServiceDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`);
      if (!response.ok) throw new Error('Failed to fetch service details');
      const data = await response.json();
      setService(data);
      if (data.packages.length > 0) {
        setSelectedPackage(data.packages[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/services/${id}/reviews?page=${currentPage}&limit=5`
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          serviceId: id,
          rating,
          comment,
          ...(orderId && { orderId })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      setShowReviewForm(false);
      fetchServiceDetails();
      fetchReviews();
    } catch (err) {
      throw err;
    }
  };

  const handleOrder = async () => {
    if (!selectedPackage) {
      setError('Please select a package');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          serviceId: id,
          packageId: selectedPackage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const data = await response.json();
      setOrderId(data.order.id);
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Service not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Details */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {service.title}
          </h1>

          <div className="flex items-center space-x-4">
            <SellerStats
              averageRating={service.user.profile.averageRating}
              totalReviews={service.user.profile.totalReviews}
              completedGigs={service.user.profile.completedGigs}
              trophyLevel={service.user.profile.trophyLevel}
              showDetails={true}
            />
            <span className="text-gray-500 dark:text-gray-400">
              by {service.user.name}
            </span>
          </div>

          {/* Image Gallery */}
          <div className="grid grid-cols-2 gap-4">
            {service.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${service.title} - Image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2>Description</h2>
            <p>{service.description}</p>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Reviews
              </h2>
              {user && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Write a Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="mb-6">
                <ReviewForm
                  serviceId={id!}
                  onSubmit={handleReviewSubmit}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            <ReviewList
              reviews={reviews}
              totalReviews={service.user.profile.totalReviews}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Packages Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select a Package
            </h2>

            <div className="space-y-4">
              {service.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackage === pkg.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${pkg.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {pkg.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Delivery in {pkg.deliveryTime} days
                  </div>
                  <ul className="mt-2 space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
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
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={handleOrder}
              disabled={!selectedPackage}
              className="w-full mt-6 px-4 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Order Now
            </button>

            {error && (
              <div className="mt-4 text-sm text-red-500 text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails; 