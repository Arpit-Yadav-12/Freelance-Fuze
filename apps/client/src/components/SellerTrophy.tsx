import React from 'react';
import { FaTrophy } from 'react-icons/fa';

interface SellerTrophyProps {
  trophyLevel: string;
  completedGigs: number;
  size?: 'sm' | 'md' | 'lg';
}

const SellerTrophy: React.FC<SellerTrophyProps> = ({ trophyLevel, completedGigs, size = 'md' }) => {
  const getTrophyColor = () => {
    switch (trophyLevel) {
      case 'bronze':
        return 'text-amber-600';
      case 'silver':
        return 'text-gray-400';
      case 'gold':
        return 'text-yellow-400';
      case 'platinum':
        return 'text-blue-400';
      case 'diamond':
        return 'text-purple-400';
      default:
        return 'text-gray-300';
    }
  };

  const getTrophySize = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-2xl';
    }
  };

  const getNextTrophy = () => {
    switch (trophyLevel) {
      case 'none':
        return { level: 'Bronze', required: 10 };
      case 'bronze':
        return { level: 'Silver', required: 20 };
      case 'silver':
        return { level: 'Gold', required: 30 };
      case 'gold':
        return { level: 'Platinum', required: 40 };
      case 'platinum':
        return { level: 'Diamond', required: 50 };
      default:
        return null;
    }
  };

  const nextTrophy = getNextTrophy();

  return (
    <div className="flex items-center space-x-2">
      <div className="relative group">
        <FaTrophy className={`${getTrophyColor()} ${getTrophySize()}`} />
        {trophyLevel !== 'none' && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {trophyLevel.charAt(0).toUpperCase() + trophyLevel.slice(1)} Trophy
            <br />
            {completedGigs} completed gigs
          </div>
        )}
      </div>
      {nextTrophy && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {nextTrophy.required - completedGigs} more gigs for {nextTrophy.level}
        </div>
      )}
    </div>
  );
};

export default SellerTrophy; 