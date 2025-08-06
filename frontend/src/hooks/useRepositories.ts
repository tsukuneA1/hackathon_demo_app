import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface Repository {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  language: string;
  stars_count: number;
  forks_count: number;
  html_url: string;
  last_commit_message: string;
  last_commit_date: string;
  updated_at: string;
}

interface UseRepositoriesResult {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  syncRepositories: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useRepositories = (filters?: {
  language?: string;
  sort?: 'popular' | 'recent' | 'name';
  publicOnly?: boolean;
}): UseRepositoriesResult => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.language) params.append('language', filters.language);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.publicOnly) params.append('public_only', 'true');
      
      const response = await api.get(`/repositories?${params.toString()}`);
      setRepositories(response.data.repositories);
    } catch (err: any) {
      console.error('Failed to fetch repositories:', err);
      setError(err.response?.data?.error || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const syncRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/repositories/sync');
      console.log('Sync completed:', response.data);
      
      // Refetch repositories after sync
      await fetchRepositories();
    } catch (err: any) {
      console.error('Failed to sync repositories:', err);
      setError(err.response?.data?.error || 'Failed to sync repositories');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [filters?.language, filters?.sort, filters?.publicOnly]);

  return {
    repositories,
    loading,
    error,
    syncRepositories,
    refetch: fetchRepositories
  };
};