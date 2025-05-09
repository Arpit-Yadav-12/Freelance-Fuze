import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  const categories = [
    { name: "Graphics & Design", icon: "🎨" },
    { name: "Digital Marketing", icon: "📱" },
    { name: "Writing & Translation", icon: "✍️" },
    { name: "Video & Animation", icon: "🎬" },
    { name: "Music & Audio", icon: "🎵" },
    { name: "Programming & Tech", icon: "💻" },
    { name: "Business", icon: "💼" },
    { name: "Lifestyle", icon: "🌟" },
  ];

  const popularServices = [
    {
      id: 1,
      title: "I will design a professional logo",
      seller: "John Doe",
      rating: 4.9,
      reviews: 128,
      price: 25,
      image: "https://via.placeholder.com/300x200",
    },
    {
      id: 2,
      title: "I will create a responsive website",
      seller: "Jane Smith",
      rating: 4.8,
      reviews: 95,
      price: 50,
      image: "https://via.placeholder.com/300x200",
    },
    {
      id: 3,
      title: "I will write SEO optimized content",
      seller: "Mike Johnson",
      rating: 4.7,
      reviews: 156,
      price: 30,
      image: "https://via.placeholder.com/300x200",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1DBF73] to-[#19a463] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find the perfect <span className="italic">freelance</span>{" "}
              services for your business
            </h1>
            <div className="flex items-center max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-full p-2">
              <input
                type="text"
                placeholder="Search for any service..."
                className="flex-1 px-4 py-2 text-gray-800 dark:text-gray-200 bg-transparent focus:outline-none"
              />
              <button className="bg-[#1DBF73] text-white px-6 py-2 rounded-full font-medium hover:bg-[#19a463] transition-colors">
                Search
              </button>
            </div>
            <div className="mt-4 flex items-center font-bold justify-center space-x-4 text-md">
              <span>Popular:</span>
              <div className="flex space-x-2">
                <Link
                  to="/explore?category=website"
                  className="hover:underline"
                >
                  Website Design
                </Link>
                <Link
                  to="/explore?category=wordpress"
                  className="hover:underline"
                >
                  WordPress
                </Link>
                <Link to="/explore?category=logo" className="hover:underline">
                  Logo Design
                </Link>
                <Link to="/explore?category=video" className="hover:underline">
                  Video Editing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Popular Professional Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/explore?category=${encodeURIComponent(category.name)}`}
                className="flex flex-col items-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-4">{category.icon}</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium text-center">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Services Section */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-12 text-gray-900 dark:text-white">
            Popular Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularServices.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${service.seller}`}
                        alt={service.seller}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {service.seller}
                      </span>
                    </div>
                    <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-2 group-hover:text-[#1DBF73] transition-colors">
                      {service.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-medium">{service.rating}</span>
                      <span className="mx-1">({service.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Starting at
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">
                        ${service.price}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
