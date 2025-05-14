import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import SellerStats from '../components/SellerStats';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import { FaStar } from 'react-icons/fa';
import TrophyBadge from '../components/TrophyBadge';

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
      avatar?: string;
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
  averageRating: number;
  reviews: any[];
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
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchServiceDetails();
    fetchReviews();
  }, [id, currentPage]);

  const fetchServiceDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`);
      if (!response.ok) throw new Error('Failed to fetch service details');
      const data = await response.json();
      console.log('Service Details:', data);
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
      console.log('Fetching reviews for service:', id);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/services/${id}/reviews?page=${currentPage}&limit=10&sort=createdAt:desc`
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      console.log('Reviews Data:', data);
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
      // Find the selected package details
      const selectedPackageDetails = service?.packages.find(pkg => pkg.id === selectedPackage);
      if (!selectedPackageDetails) {
        setError('Invalid package selected');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          serviceId: id,
          packageId: selectedPackage,
          totalAmount: selectedPackageDetails.price,
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

  console.log('Reviews state before render:', reviews);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Details */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {service.title}
          </h1>

          {/* Seller Info Section */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <img
              src={
                service.user.profile?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${service.user.name}`
              }
              alt={service.user.name}
              className="w-14 h-14 rounded-full border object-cover"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-gray-900 dark:text-white">{service.user.name}</span>
                <span className="text-yellow-500 font-semibold text-base flex items-center gap-1">
                  <FaStar className="inline-block mb-0.5" />
                  {(typeof service.averageRating === 'number' && !isNaN(service.averageRating))
                    ? service.averageRating.toFixed(1)
                    : '0.0'}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span><strong>{service.reviews?.length ?? 0}</strong> review{service.reviews?.length === 1 ? '' : 's'}</span>
              </div>
            </div>
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
          <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Reviews ({service.reviews?.length})
              </h2>
              {/* {user && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Write a Review
                </button>
              )} */}
            </div>

            {showReviewForm && (
              <div className="mb-6">
                <ReviewForm
                  serviceId={id!}
                  orderId={orderId!}
                  onSubmit={handleReviewSubmit}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            {/* Latest Reviews */}
            {reviews && reviews.length > 0 ? (
              <>
                <div className="space-y-4">
                  {reviews.slice(0, 2).map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            src={
                              review.user.profile?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${review.user.name}`
                            }
                            alt={review.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {review.user.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <FaStar
                                key={index}
                                className={`${
                                  index < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* See More Button */}
                {reviews.length > 2 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      See More Reviews
                      <svg
                        className="ml-2 -mr-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No reviews yet. Be the first to review this service!
              </div>
            )}

            {/* All Reviews Modal */}
            {showAllReviews && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      All Reviews
                    </h3>
                    <button
                      onClick={() => setShowAllReviews(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <ReviewList
                    reviews={reviews}
                    totalReviews={service.user.profile.totalReviews}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
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