import React from 'react';
import { Link } from 'react-router-dom';
import SellerStats from './SellerStats';

interface ServiceCardProps {
  service: {
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
      price: number;
    }>;
  };
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const lowestPrice = Math.min(...service.packages.map(pkg => pkg.price));

  return (
    <Link to={`/services/${service.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48">
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {service.title}
            </h3>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              ${lowestPrice}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
          <div className="flex items-center justify-between">
            <SellerStats
              averageRating={service.user.profile.averageRating}
              totalReviews={service.user.profile.totalReviews}
              completedGigs={service.user.profile.completedGigs}
              trophyLevel={service.user.profile.trophyLevel}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              by {service.user.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard; 