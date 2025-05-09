import React, { useEffect, useState, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const UserSetup: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    const createUser = async () => {
      if (!isLoaded || !user) return;
      if (isCreatingRef.current) return; // Prevent multiple creation attempts

      try {
        isCreatingRef.current = true;
        const token = await getToken();
        if (!token) {
          console.error('No token available');
          return;
        }

        // First verify if user exists
        const verifyResponse = await fetch('/api/auth/verify-user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // If user exists, we don't need to create a new one
        if (verifyResponse.ok) {
          console.log('User already exists in database');
          return;
        }

        // If user doesn't exist, create new user
        const response = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            clerkId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating user:', errorData);
          setError(errorData.error || 'Failed to create user');
          return;
        }

        const data = await response.json();
        console.log('User created successfully:', data);
      } catch (error) {
        console.error('Error in user setup:', error);
        setError('Failed to set up user account');
      } finally {
        isCreatingRef.current = false;
      }
    };

    createUser();
  }, [isLoaded, user, getToken]); // Removed isCreating from dependencies

  if (error) {
    console.error('UserSetup error:', error);
  }

  return null;
};

export default UserSetup; 