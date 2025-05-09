import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface TrophyBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TrophyBadge: React.FC<TrophyBadgeProps> = ({ 
  level, 
  size = 'md', 
  showLabel = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const trophyColors = {
    none: 'text-gray-400',
    wooden: 'text-amber-800',
    bronze: 'text-amber-600',
    silver: 'text-gray-400',
    gold: 'text-yellow-400',
    platinum: 'text-blue-400',
    diamond: 'text-purple-400'
  };

  const trophyLabels = {
    none: 'No Trophy',
    wooden: 'Wooden Trophy',
    bronze: 'Bronze Trophy',
    silver: 'Silver Trophy',
    gold: 'Gold Trophy',
    platinum: 'Platinum Trophy',
    diamond: 'Diamond Trophy'
  };

  return (
    <div className="flex items-center gap-1">
      <TrophyIcon 
        className={`${sizeClasses[size]} ${trophyColors[level as keyof typeof trophyColors]}`} 
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-600">
          {trophyLabels[level as keyof typeof trophyLabels]}
        </span>
      )}
    </div>
  );
};

export default TrophyBadge; 