import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CATEGORIES, isValidCategory, normalizeCategory } from '../constants/categories';

interface Package {
  id?: string;
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
}

const EditService: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Service>({
    id: '',
    title: '',
    description: '',
    category: '',
    images: [],
    packages: [],
  });
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(`http://localhost:5000/api/services/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch service');
        }

        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching service:', error);
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, getToken]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const handlePackageChange = (index: number, field: keyof Package, value: string | number) => {
    const newPackages = [...formData.packages];
    if (field === 'features') {
      newPackages[index].features = (value as string).split('\n').filter((f: string) => f.trim());
    } else {
      (newPackages[index] as any)[field] = value;
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

    const normalizedCategory = normalizeCategory(formData.category);
    if (!normalizedCategory) {
      setError('Please select a valid category');
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // First, upload new images to get their URLs
      const newImageUrls = await Promise.all(
        formData.images
          .filter(image => image instanceof File)
          .map(async (image) => {
            const formData = new FormData();
            formData.append('image', image as File);

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

      // Combine existing image URLs with new ones
      const existingImageUrls = formData.images.filter(image => typeof image === 'string');
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      // Then update the service
      const response = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          category: normalizedCategory,
          images: allImageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service');
      }

      navigate('/profile');
    } catch (error) {
      console.error('Error updating service:', error);
      setError(error instanceof Error ? error.message : 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DBF73] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Edit Service</h1>

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
                    Images
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-w-16 aspect-h-9">
                        <img
                          src={image}
                          alt={`Service image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Add more images to your service
                  </p>
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
                          value={pkg.price}
                          onChange={(e) => handlePackageChange(index, 'price', parseFloat(e.target.value))}
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
                          value={pkg.deliveryTime}
                          onChange={(e) => handlePackageChange(index, 'deliveryTime', parseInt(e.target.value))}
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
                disabled={saving}
                className="bg-[#1DBF73] text-white px-8 py-3 rounded-lg hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditService; 