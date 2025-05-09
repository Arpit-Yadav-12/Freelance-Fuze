import React from 'react';
import { FaStar } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

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

interface ReviewListProps {
  reviews: Review[];
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  totalReviews,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={`${
          index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reviews ({totalReviews})
        </h3>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
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
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex items-center mt-1">
                  {renderStars(review.rating)}
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

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList; 