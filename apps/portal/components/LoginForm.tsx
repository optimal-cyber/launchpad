'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface LoginFormProps {
  onLoginSuccess: (token: string, userInfo: any) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.access_token, data.user_info);
        router.push('/launchpad');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <Image
              src="/optimal-logo.png"
              alt="Optimal Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Optimal</h1>
          <p className="text-sm text-gray-600">Please Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {isLoading ? 'Loading...' : 'LOGIN'}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900 uppercase tracking-wide font-medium"
                onClick={() => alert('Please contact your administrator to reset your password.')}
              >
                FORGOT PASSWORD?
              </button>
            </div>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => alert('Please contact your administrator to request access.')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}