import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CATEGORIES, isValidCategory } from '../constants/categories';

interface Package {
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
  features: string[];
}

const ListService: React.FC = () => {
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    images: [] as File[],
    packages: [
      {
        name: 'Basic',
        description: '',
        price: 0,
        deliveryTime: 1,
        features: [''],
      },
      {
        name: 'Standard',
        description: '',
        price: 0,
        deliveryTime: 1,
        features: [''],
      },
      {
        name: 'Premium',
        description: '',
        price: 0,
        deliveryTime: 1,
        features: [''],
      },
    ] as Package[],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }
  };

  const handlePackageChange = (index: number, field: keyof Package, value: string | number) => {
    const newPackages = [...formData.packages];
    if (field === 'features') {
      newPackages[index].features = (value as string).split('\n').filter((f: string) => f.trim());
    } else if (field === 'price') {
      // Ensure price is a valid number and not negative
      const numValue = Number(value);
      newPackages[index].price = isNaN(numValue) ? 0 : Math.max(0, numValue);
    } else if (field === 'deliveryTime') {
      // Ensure delivery time is a valid number and at least 1
      const numValue = Number(value);
      newPackages[index].deliveryTime = isNaN(numValue) ? 1 : Math.max(1, numValue);
    } else {
      newPackages[index][field] = value as string;
    }
    setFormData(prev => ({
      ...prev,
      packages: newPackages,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate packages
    const invalidPackages = formData.packages.filter(pkg => 
      pkg.price < 0 || pkg.deliveryTime < 1 || !pkg.description.trim()
    );

    if (invalidPackages.length > 0) {
      setError('Please ensure all packages have valid prices, delivery times, and descriptions');
      setLoading(false);
      return;
    }

    if (!isValidCategory(formData.category)) {
      setError('Please select a valid category');
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // First, upload images to get their URLs
      const imageUrls = await Promise.all(
        formData.images.map(async (image) => {
          const formData = new FormData();
          formData.append('image', image);

          const response = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();
          return data.url;
        })
      );

      // Then create the service with the image URLs
      const response = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create service');
      }

      navigate('/profile');
    } catch (error) {
      console.error('Error creating service:', error);
      setError(error instanceof Error ? error.message : 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Create a New Service</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., I will create a professional logo design"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe your service in detail"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Images
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index),
                              }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg
                              className="w-4 h-4"
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Packages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Service Packages</h2>
              <div className="space-y-8">
                {formData.packages.map((pkg, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{pkg.name} Package</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          required
                          value={pkg.description}
                          onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder={`Describe what's included in the ${pkg.name.toLowerCase()} package`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={pkg.price || ''}
                          onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Delivery Time (days)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={pkg.deliveryTime || ''}
                          onChange={(e) => handlePackageChange(index, 'deliveryTime', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Features (one per line)
                        </label>
                        <textarea
                          required
                          value={pkg.features.join('\n')}
                          onChange={(e) => handlePackageChange(index, 'features', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="List the features included in this package"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1DBF73] text-white px-8 py-3 rounded-lg hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Service...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListService; 