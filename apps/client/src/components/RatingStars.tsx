import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  size = 'md', 
  showNumber = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <StarIcon 
        key={`full-${i}`} 
        className={`${sizeClasses[size]} text-yellow-400`} 
      />
    );
  }

  // Add half star if needed
  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative">
        <StarOutlineIcon className={`${sizeClasses[size]} text-yellow-400`} />
        <StarIcon 
          className={`${sizeClasses[size]} text-yellow-400 absolute top-0 left-0 w-1/2 overflow-hidden`} 
        />
      </div>
    );
  }

  // Add empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <StarOutlineIcon 
        key={`empty-${i}`} 
        className={`${sizeClasses[size]} text-yellow-400`} 
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars}
      </div>
      {showNumber && (
        <span className="font-semibold">{typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}</span>
      )}
    </div>
  );
};

export default RatingStars; 