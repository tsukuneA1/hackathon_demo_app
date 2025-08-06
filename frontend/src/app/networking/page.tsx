'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Engineer {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  repository_count: number;
  total_stars: number;
  summary?: string;
  skills?: string[];
  technologies?: string[];
  experience_level?: string;
  personality?: string;
  strengths?: string[];
  communication_style?: string;
  similarity_score?: number;
}

interface TrendingItem {
  name: string;
  count: number;
}

export default function NetworkingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [similarEngineers, setSimilarEngineers] = useState<Engineer[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<TrendingItem[]>([]);
  const [trendingTechnologies, setTrendingTechnologies] = useState<TrendingItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({
    skills: '',
    experience_level: '',
    technology: ''
  });
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadInitialData();
    }
  }, [user, loading, router]);

  const loadInitialData = async () => {
    await Promise.all([
      fetchSimilarEngineers(),
      fetchTrendingSkills(),
      discoverEngineers()
    ]);
  };

  const discoverEngineers = async () => {
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const searchParams = new URLSearchParams();
      
      if (filters.skills) searchParams.append('skills', filters.skills);
      if (filters.experience_level) searchParams.append('experience_level', filters.experience_level);
      if (filters.technology) searchParams.append('technology', filters.technology);
      
      const response = await fetch(`http://localhost:3001/networking/discover_engineers?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEngineers(data.engineers);
      }
    } catch (err) {
      console.error('Failed to discover engineers:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchSimilarEngineers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/networking/similar_engineers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSimilarEngineers(data.engineers);
      }
    } catch (err) {
      console.error('Failed to fetch similar engineers:', err);
    }
  };

  const fetchTrendingSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/networking/trending_skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrendingSkills(data.trending_skills);
        setTrendingTechnologies(data.trending_technologies);
      }
    } catch (err) {
      console.error('Failed to fetch trending skills:', err);
    }
  };

  const chatWithEngineer = async (engineer: Engineer) => {
    if (!chatQuestion.trim()) return;
    
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/networking/chat_with_engineer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engineer_id: engineer.id,
          question: chatQuestion
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.answer);
      } else {
        setChatResponse('Sorry, I could not get a response at this time.');
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setChatResponse('Sorry, I could not get a response at this time.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = () => {
    discoverEngineers();
  };

  const openEngineerDialog = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setChatQuestion('');
    setChatResponse(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">Engineer Networking</h1>
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Discover Engineers</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Skills (comma-separated)"
                value={filters.skills}
                onChange={(e) => setFilters({...filters, skills: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={filters.experience_level}
                onChange={(e) => setFilters({...filters, experience_level: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Experience Levels</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
              <input
                type="text"
                placeholder="Technology"
                value={filters.technology}
                onChange={(e) => setFilters({...filters, technology: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Similar Engineers */}
          {similarEngineers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Engineers Similar to You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarEngineers.map((engineer) => (
                  <div key={engineer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => openEngineerDialog(engineer)}>
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={engineer.avatar_url}
                        alt={engineer.username}
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{engineer.name || engineer.username}</h4>
                        <p className="text-xs text-gray-500">@{engineer.username}</p>
                      </div>
                      {engineer.similarity_score && (
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {engineer.similarity_score}% match
                          </span>
                        </div>
                      )}
                    </div>
                    {engineer.summary && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{engineer.summary}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{engineer.repository_count} repos</span>
                      <span>⭐ {engineer.total_stars}</span>
                      {engineer.experience_level && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {engineer.experience_level}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Engineers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Engineers ({engineers.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engineers.map((engineer) => (
                <div key={engineer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => openEngineerDialog(engineer)}>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={engineer.avatar_url}
                      alt={engineer.username}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{engineer.name || engineer.username}</h4>
                      <p className="text-xs text-gray-500">@{engineer.username}</p>
                    </div>
                  </div>
                  {engineer.summary && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{engineer.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {engineer.skills?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{engineer.repository_count} repos</span>
                    <span>⭐ {engineer.total_stars}</span>
                    {engineer.experience_level && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {engineer.experience_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Engineer Detail Modal */}
      {selectedEngineer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={selectedEngineer.avatar_url}
                    alt={selectedEngineer.username}
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedEngineer.name || selectedEngineer.username}
                    </h3>
                    <p className="text-sm text-gray-500">@{selectedEngineer.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEngineer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedEngineer.summary && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700">{selectedEngineer.summary}</p>
                </div>
              )}

              {selectedEngineer.skills && selectedEngineer.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEngineer.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEngineer.technologies && selectedEngineer.technologies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEngineer.technologies.map((tech, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Ask about this engineer</h4>
                {chatResponse && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-800">{chatResponse}</p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask about their skills, experience, or work style..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    onClick={() => chatWithEngineer(selectedEngineer)}
                    disabled={chatLoading || !chatQuestion.trim()}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chatLoading ? 'Asking...' : 'Ask'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}