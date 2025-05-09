import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  orderId,
  onSuccess,
  onError,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (cardNumber.length !== 16) {
      onError('Please enter a valid 16-digit card number');
      return;
    }
    if (expiry.length !== 5) {
      onError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (cvv.length !== 3) {
      onError('Please enter a valid 3-digit CVV');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          paymentMethod: 'card',
          cardDetails: {
            number: cardNumber,
            expiry,
            cvv,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const data = await response.json();
      
      // Show success alert
      setShowSuccess(true);
      
      // Close success alert and modal after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Make Payment
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">
              Amount to pay: ${amount}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DBF73] dark:bg-gray-700 dark:text-white"
                maxLength={16}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry"
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DBF73] dark:bg-gray-700 dark:text-white"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1DBF73] dark:bg-gray-700 dark:text-white"
                  maxLength={3}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1DBF73] text-white px-4 py-2 rounded-md hover:bg-[#19a463] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>

          {/* Success Alert */}
          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Payment Successful!</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Your payment has been processed successfully.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PaymentModal; 