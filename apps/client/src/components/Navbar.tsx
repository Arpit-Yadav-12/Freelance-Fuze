import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

const Navbar: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 font-bold shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#1DBF73]">
              Freelance Fuze
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/explore"
              className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
            >
              Explore
            </Link>
            {user && (
              <>
                <Link
                  to="/orders"
                  className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
                >
                  Orders
                </Link>
                {user.publicMetadata.role === "seller" && (
                  <Link
                    to="/list-service"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
                  >
                    List Service
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu and Theme Toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user && <NotificationBell />}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden md:block text-gray-700 dark:text-gray-300">
                    {user.fullName}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {user.publicMetadata.role !== "seller" && (
                      <Link
                        to="/become-seller"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Become a Seller
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <button className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-[#1DBF73] text-white px-4 py-2 rounded-lg hover:bg-[#19a463] transition-colors">
                    Join
                  </button>
                </SignUpButton>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link
                to="/explore"
                className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore
              </Link>
              {user && (
                <>
                  <Link
                    to="/orders"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {user.publicMetadata.role === "seller" && (
                    <Link
                      to="/list-service"
                      className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      List Service
                    </Link>
                  )}
                </>
              )}
              {!user && (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SignInButton mode="modal">
                    <button className="text-gray-600 dark:text-gray-300 hover:text-[#1DBF73] transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-[#1DBF73] text-white px-4 py-2 rounded-lg hover:bg-[#19a463] transition-colors">
                      Join
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
