'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileAnalysis {
  id: number;
  summary: string;
  skills: string[];
  technologies: string[];
  experience_level: string;
  personality: string;
  strengths: string[];
  communication_style: string;
  analyzed_at: string;
  needs_update: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  question: string;
  answer: string;
  timestamp: Date;
}

export default function ProfileAnalysis() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/profile_analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.profile_analysis);
      } else if (response.status === 404) {
        setAnalysis(null);
      } else {
        throw new Error('Failed to fetch profile analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/profile_analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.profile_analysis);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatQuestion.trim() || chatLoading) return;
    
    setChatLoading(true);
    const question = chatQuestion;
    setChatQuestion('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/profile_analysis/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          question,
          answer: data.answer,
          timestamp: new Date()
        }]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get chat response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, {
        question,
        answer: 'Sorry, I could not process your question at this time.',
        timestamp: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading profile analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">AI Profile Analysis</h3>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            analysis ? 'Re-analyze Profile' : 'Analyze Profile'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!analysis ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No profile analysis available. Click "Analyze Profile" to get AI insights about your GitHub profile.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analysis Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700">{analysis.summary}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Experience Level</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {analysis.experience_level}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Technologies</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.technologies.map((tech, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.strengths.map((strength, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Personality</h4>
              <p className="text-sm text-gray-700">{analysis.personality}</p>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Ask about this profile</h4>
            
            {/* Chat Messages */}
            <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
              {chatMessages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Q: {message.question}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-800">{message.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about this engineer's skills, experience, or work style..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatQuestion.trim()}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}