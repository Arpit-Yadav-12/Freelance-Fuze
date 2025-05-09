import React from 'react';
import RatingStars from './RatingStars';
import TrophyBadge from './TrophyBadge';

interface SellerStatsProps {
  averageRating: number;
  totalReviews: number;
  completedGigs: number;
  trophyLevel: string;
  showDetails?: boolean;
}

const SellerStats: React.FC<SellerStatsProps> = ({
  averageRating,
  totalReviews,
  completedGigs,
  trophyLevel,
  showDetails = false
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <RatingStars rating={averageRating} size="md" showNumber />
        <TrophyBadge level={trophyLevel} size="md" showLabel />
      </div>
      
      {showDetails && (
        <div className="text-sm text-gray-600">
          <p>{totalReviews} reviews</p>
          <p>{completedGigs} completed gigs</p>
        </div>
      )}
    </div>
  );
};

export default SellerStats; 