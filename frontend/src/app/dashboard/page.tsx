'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Engineer Connect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <img
                className="h-8 w-8 rounded-full"
                src={user.avatar_url}
                alt={user.username}
              />
              <span className="text-sm font-medium text-gray-700">
                {user.name || user.username}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <img
                className="mx-auto h-24 w-24 rounded-full"
                src={user.avatar_url}
                alt={user.username}
              />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Welcome, {user.name || user.username}!
              </h2>
              <p className="mt-2 text-gray-600">
                GitHub: @{user.username}
              </p>
              {user.email && (
                <p className="mt-1 text-gray-600">
                  Email: {user.email}
                </p>
              )}
              <div className="mt-6">
                <p className="text-lg text-gray-700">
                  🚧 Under Construction 🚧
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  AI-powered profile analysis and engineer matching coming soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}