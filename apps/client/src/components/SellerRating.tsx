import React from 'react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { BsStar } from 'react-icons/bs';

interface SellerRatingProps {
  rating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

const SellerRating: React.FC<SellerRatingProps> = ({ rating, totalReviews, size = 'md' }) => {
  const getStarSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar
          key={`full-${i}`}
          className={`${getStarSize()} text-yellow-400`}
        />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt
          key="half"
          className={`${getStarSize()} text-yellow-400`}
        />
      );
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <BsStar
          key={`empty-${i}`}
          className={`${getStarSize()} text-yellow-400`}
        />
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {renderStars()}
      </div>
      <div className={`${getStarSize()} text-gray-600 dark:text-gray-300`}>
        <span className="font-semibold">{rating.toFixed(1)}</span>
        {totalReviews > 0 && (
          <span className="ml-1">
            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    </div>
  );
};

export default SellerRating; 