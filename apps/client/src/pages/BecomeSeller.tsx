import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

const BecomeSeller: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    category: '',
    portfolio: '',
    experience: '',
    education: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // First, verify if the user exists
      const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('Verify user response:', errorText);
        throw new Error('User verification failed. Please try signing out and back in.');
      }

      // If user exists, create seller profile
      const response = await fetch('http://localhost:5000/api/seller/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          bio: formData.bio,
          skills: formData.skills.split(',').map(skill => skill.trim()),
          hourlyRate: parseFloat(formData.hourlyRate),
          category: formData.category,
          portfolio: formData.portfolio,
          experience: formData.experience,
          education: formData.education,
          // Initialize seller statistics
          averageRating: 0,
          totalReviews: 0,
          completedGigs: 0,
          trophyLevel: 'none'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create seller profile response:', errorText);
        throw new Error('Failed to create seller profile. Please try again.');
      }

      try {
        const data = await response.json();
        console.log('Seller profile created:', data);

        // Update user role in Clerk
        await user?.update({
          unsafeMetadata: { role: 'seller' },
        });

        navigate('/profile');
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid server response. Please try again.');
      }
    } catch (error) {
      console.error('Error creating seller profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to create seller profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const categories = [
    { value: '', label: 'Select a category' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'video-animation', label: 'Video & Animation' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'business', label: 'Business' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Become a Seller</h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Professional Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Senior Web Developer"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tell us about yourself and your experience..."
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Web Development, UI/UX Design, Content Writing"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your professional experience..."
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Education
                </label>
                <textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="List your educational background..."
                />
              </div>

              <div>
                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://your-portfolio.com"
                />
              </div>

              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 25.00"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1DBF73] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Profile...' : 'Create Seller Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller; 