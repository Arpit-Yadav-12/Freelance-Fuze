import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, normalizeCategory } from '../constants/categories';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
  features: string[];
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  packages: Package[];
  averageRating: number;
  user: {
    id: string;
    name: string;
    profile: {
      location: string;
    } | null;
  };
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

interface ApiResponse {
  services: Service[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
}

const categories = ['All Categories', ...CATEGORIES];

const sortOptions = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'averageRating', label: 'Rating' },
];

const Explore: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Add handlers for filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page on category change
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
    setCurrentPage(1); // Reset to first page on price change
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      // Add search term if not empty
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      // Add category if not "All Categories"
      if (selectedCategory !== 'All Categories') {
        const normalizedCategory = normalizeCategory(selectedCategory);
        if (normalizedCategory) {
          queryParams.append('category', normalizedCategory);
        }
      }

      // Add price filters if they have values
      if (minPrice && !isNaN(Number(minPrice))) {
        queryParams.append('minPrice', minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        queryParams.append('maxPrice', maxPrice);
      }

      // Add sort parameters
      if (sortBy) {
        const [field, order] = sortBy.startsWith('-') 
          ? [sortBy.slice(1), 'desc'] 
          : [sortBy, 'asc'];
        queryParams.append('sortBy', field);
        queryParams.append('sortOrder', order);
      }

      console.log('Fetching services with params:', Object.fromEntries(queryParams.entries()));

      const response = await fetch(`http://localhost:5000/api/services?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server response:', data); // Debug log
      
      // Handle both array and object responses
      let services: Service[];
      let pagination: Pagination;

      if (Array.isArray(data)) {
        services = data;
        pagination = {
          total: data.length,
          pages: Math.ceil(data.length / itemsPerPage),
          currentPage: currentPage,
          limit: itemsPerPage
        };
      } else if (data && Array.isArray(data.services)) {
        services = data.services;
        pagination = data.pagination || {
          total: data.services.length,
          pages: Math.ceil(data.services.length / itemsPerPage),
          currentPage: currentPage,
          limit: itemsPerPage
        };
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format: unable to parse services data');
      }

      setServices(services);
      setTotalPages(pagination.pages);
      setTotalItems(pagination.total);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error instanceof Error ? error.message : 'Failed to load services');
      setServices([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, currentPage, itemsPerPage]);

  // Add debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, currentPage, fetchServices]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DBF73] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading services...</p>
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
        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Explore Services</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search services..."
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                placeholder="Min Price"
                className="w-1/2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                placeholder="Max Price"
                className="w-1/2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No services found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={service.images[0] || 'https://via.placeholder.com/400x225'}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${service.user.name}`}
                          alt={service.user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{service.user.name}</p>
                        {service.user.profile?.location && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">📍 {service.user.profile.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-[#1DBF73]/10 text-[#1DBF73] rounded-full">
                        {service.category}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{service.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Rating:</span>
                        <span className="text-sm font-medium text-yellow-500">
                          {(service.averageRating || 0).toFixed(1)} ⭐
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Starting at</span>
                        <span className="text-lg font-bold text-[#1DBF73] block">
                          ${Math.min(...(service.packages?.map(pkg => pkg.price) || [0]))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === currentPage
                        ? 'bg-[#1DBF73] text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;