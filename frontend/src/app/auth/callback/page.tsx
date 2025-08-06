'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('GitHub authentication was cancelled or failed');
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authentication code received');
        setLoading(false);
        return;
      }

      try {
        console.log('Received OAuth code:', code);
        
        // For demo purposes, we'll get the access token directly from GitHub
        // In production, this should be done server-side
        const response = await fetch('/api/auth/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Token exchange failed:', errorData);
          throw new Error(`Failed to exchange code for token: ${errorData.error || response.statusText}`);
        }

        const { access_token } = await response.json();
        console.log('Received access token:', access_token);
        
        await login(access_token);
        router.push('/dashboard');
      } catch (err) {
        console.error('Authentication error:', err);
        setError(`Authentication failed: ${err.message}`);
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Authenticating with GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}