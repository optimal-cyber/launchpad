'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleLoginSuccess = (token: string, userInfo: any) => {
    // Store authentication data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    
    setIsAuthenticated(true);
    
    // Redirect to dashboard after successful login
    setTimeout(() => {
      router.push('/launchpad');
    }, 1000);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Login successful! Redirecting...</p>
        </div>
      </div>
    );
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}












