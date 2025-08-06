'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRepositories } from '@/hooks/useRepositories';
import RepositoryCard from '@/components/RepositoryCard';
import ProfileAnalysis from '@/components/ProfileAnalysis';
import CodeAnalysis from '@/components/CodeAnalysis';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({
    sort: 'name' as 'popular' | 'recent' | 'name',
    language: '',
    publicOnly: false
  });
  
  const { repositories, loading: reposLoading, error, syncRepositories, updateRepository } = useRepositories(filters);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSync = async () => {
    await syncRepositories();
  };

  const getUniqueLanguages = () => {
    const languages = repositories
      .map(repo => repo.language)
      .filter(lang => lang && lang.trim() !== '')
      .filter((lang, index, arr) => arr.indexOf(lang) === index)
      .sort();
    return languages;
  };

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
              <button
                onClick={() => router.push('/networking')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Networking
              </button>
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
          {/* User Profile Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center space-x-4">
              <img
                className="h-16 w-16 rounded-full"
                src={user.avatar_url}
                alt={user.username}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name || user.username}
                </h2>
                <p className="text-gray-600">@{user.username}</p>
                {user.email && (
                  <p className="text-sm text-gray-500">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Analysis Section */}
          <ProfileAnalysis />

          {/* Code Analysis Section */}
          <div className="mt-6">
            <CodeAnalysis 
              repositories={repositories} 
              onRepositoryUpdate={(updatedRepo) => {
                console.log('Repository updated:', updatedRepo);
              }}
            />
          </div>

          {/* Repositories Section */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Repositories ({repositories.length})
                </h3>
                <button
                  onClick={handleSync}
                  disabled={reposLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reposLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    'Sync Repositories'
                  )}
                </button>
              </div>

              {/* Filters */}
              <div className="mt-4 flex items-center space-x-4">
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({...filters, sort: e.target.value as any})}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="name">Name</option>
                  <option value="popular">Most Stars</option>
                  <option value="recent">Recently Updated</option>
                </select>

                <select
                  value={filters.language}
                  onChange={(e) => setFilters({...filters, language: e.target.value})}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Languages</option>
                  {getUniqueLanguages().map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.publicOnly}
                    onChange={(e) => setFilters({...filters, publicOnly: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Public only</span>
                </label>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {reposLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading repositories...</p>
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No repositories found. Click "Sync Repositories" to fetch your GitHub repos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repositories.map(repo => (
                    <RepositoryCard key={repo.id} repository={repo} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}