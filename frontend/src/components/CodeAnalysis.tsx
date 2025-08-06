'use client';

import { useState } from 'react';

interface Repository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars_count: number;
  forks_count: number;
  private: boolean;
  html_url: string;
  analysis?: {
    total_lines: number;
    complexity_score: number;
    function_count: number;
    class_count: number;
    quality_score: number;
    complexity_level: string;
    maintainability: string;
    architecture_pattern: string;
    strengths: string;
    improvements: string;
    tech_insights: string;
    analyzed_at: string;
  };
}

interface CodeAnalysisProps {
  repositories: Repository[];
  onRepositoryUpdate: (repository: Repository) => void;
}

export default function CodeAnalysis({ repositories, onRepositoryUpdate }: CodeAnalysisProps) {
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const analyzeRepository = async (repositoryId: number) => {
    setAnalyzing(repositoryId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/code_analysis/${repositoryId}/analyze_repository`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        onRepositoryUpdate(data.repository);
      } else {
        const errorData = await response.json();
        console.error('Analysis failed:', errorData.error);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  const showRepositoryInsights = (repository: Repository) => {
    setSelectedRepo(repository);
    setShowInsights(true);
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getComplexityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMaintainabilityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (repositories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Code Analysis</h3>
        <p className="text-gray-500">No repositories available for analysis. Please sync your repositories first.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Code Analysis</h3>
          <p className="text-sm text-gray-500">Deep dive into your code quality and architecture</p>
        </div>

        <div className="space-y-4">
          {repositories.map((repo) => (
            <div key={repo.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{repo.name}</h4>
                    {repo.language && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {repo.language}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      ⭐ {repo.stars_count} • 🍴 {repo.forks_count}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {repo.analysis ? (
                    <button
                      onClick={() => showRepositoryInsights(repo)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      View Insights
                    </button>
                  ) : null}
                  
                  <button
                    onClick={() => analyzeRepository(repo.id)}
                    disabled={analyzing === repo.id}
                    className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing === repo.id ? 'Analyzing...' : repo.analysis ? 'Re-analyze' : 'Analyze Code'}
                  </button>
                </div>
              </div>

              {repo.analysis && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityScoreColor(repo.analysis.quality_score)}`}>
                      Quality: {repo.analysis.quality_score}/10
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(repo.analysis.complexity_level)}`}>
                      {repo.analysis.complexity_level} Complexity
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMaintainabilityColor(repo.analysis.maintainability)}`}>
                      {repo.analysis.maintainability}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">
                      {repo.analysis.total_lines} lines
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insights Modal */}
      {showInsights && selectedRepo && selectedRepo.analysis && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Code Analysis: {selectedRepo.name}
                </h3>
                <button
                  onClick={() => setShowInsights(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Metrics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRepo.analysis.total_lines}</div>
                    <div className="text-sm text-gray-600">Total Lines</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRepo.analysis.function_count}</div>
                    <div className="text-sm text-gray-600">Functions</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRepo.analysis.class_count}</div>
                    <div className="text-sm text-gray-600">Classes</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRepo.analysis.complexity_score}</div>
                    <div className="text-sm text-gray-600">Complexity</div>
                  </div>
                </div>

                {/* Architecture & Pattern */}
                {selectedRepo.analysis.architecture_pattern && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Architecture Pattern</h4>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                      {selectedRepo.analysis.architecture_pattern}
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {selectedRepo.analysis.strengths && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                      {selectedRepo.analysis.strengths}
                    </p>
                  </div>
                )}

                {/* Improvements */}
                {selectedRepo.analysis.improvements && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Improvement Suggestions</h4>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
                      {selectedRepo.analysis.improvements}
                    </p>
                  </div>
                )}

                {/* Technical Insights */}
                {selectedRepo.analysis.tech_insights && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Insights</h4>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                      {selectedRepo.analysis.tech_insights}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Analyzed on {new Date(selectedRepo.analysis.analyzed_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}