export const CATEGORIES = [
  'Graphics & Design',
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'Music & Audio',
  'Programming & Tech',
  'Business',
  'Lifestyle'
] as const;

export type Category = typeof CATEGORIES[number];

// Simple check if a category is valid
export const isValidCategory = (category: string): category is Category => {
  return CATEGORIES.includes(category as Category);
};

// Helper function to normalize category names
export const normalizeCategory = (category: string): Category | null => {
  const normalized = category.toLowerCase().trim();
  const categoryMap: { [key: string]: Category } = {
    'design': 'Graphics & Design',
    'graphics': 'Graphics & Design',
    'graphics & design': 'Graphics & Design',
    'digital marketing': 'Digital Marketing',
    'marketing': 'Digital Marketing',
    'writing': 'Writing & Translation',
    'translation': 'Writing & Translation',
    'writing & translation': 'Writing & Translation',
    'video': 'Video & Animation',
    'animation': 'Video & Animation',
    'video & animation': 'Video & Animation',
    'video-animation': 'Video & Animation',
    'music': 'Music & Audio',
    'audio': 'Music & Audio',
    'music & audio': 'Music & Audio',
    'programming': 'Programming & Tech',
    'tech': 'Programming & Tech',
    'programming & tech': 'Programming & Tech',
    'business': 'Business',
    'lifestyle': 'Lifestyle'
  };

  return categoryMap[normalized] || null;
};

// Helper function to get display name for a category
export const getCategoryDisplayName = (category: string): string => {
  return category;
}; 