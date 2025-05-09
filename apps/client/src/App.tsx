import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';

// Import your components
import Home from './pages/Home';
import Explore from './pages/Explore';
import ServiceDetail from './pages/ServiceDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import EditService from './pages/EditService';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import ListService from './pages/ListService';
import BecomeSeller from './pages/BecomeSeller';
import UserSetup from './components/UserSetup';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <UserSetup />
            <main className="container mx-auto px-4 py-8">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/services/:id" element={<ServiceDetail />} />
                  <Route
                    path="/profile"
                    element={
                      <>
                        <SignedIn>
                          <Profile />
                        </SignedIn>
                        <SignedOut>
                          <RedirectToSignIn />
                        </SignedOut>
                      </>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <>
                        <SignedIn>
                          <Orders />
                        </SignedIn>
                        <SignedOut>
                          <RedirectToSignIn />
                        </SignedOut>
                      </>
                    }
                  />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/edit-service/:id" element={<EditService />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route
                    path="/list-service"
                    element={
                      <>
                        <SignedIn>
                          <ListService />
                        </SignedIn>
                        <SignedOut>
                          <RedirectToSignIn />
                        </SignedOut>
                      </>
                    }
                  />
                  <Route
                    path="/become-seller"
                    element={
                      <>
                        <SignedIn>
                          <BecomeSeller />
                        </SignedIn>
                        <SignedOut>
                          <RedirectToSignIn />
                        </SignedOut>
                      </>
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App; 