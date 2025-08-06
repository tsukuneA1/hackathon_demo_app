import { Repository } from '@/hooks/useRepositories';

interface RepositoryCardProps {
  repository: Repository;
}

export default function RepositoryCard({ repository }: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No commits';
    return new Date(dateString).toLocaleDateString();
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      JavaScript: 'bg-yellow-100 text-yellow-800',
      TypeScript: 'bg-blue-100 text-blue-800',
      Python: 'bg-green-100 text-green-800',
      Java: 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      Go: 'bg-cyan-100 text-cyan-800',
      Rust: 'bg-orange-100 text-orange-800',
      PHP: 'bg-indigo-100 text-indigo-800',
      Ruby: 'bg-red-100 text-red-800',
      Swift: 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            <a 
              href={repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {repository.name}
            </a>
          </h3>
          <p className="text-sm text-gray-600">{repository.full_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          {repository.private && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Private
            </span>
          )}
        </div>
      </div>

      {repository.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {repository.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {repository.language && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(repository.language)}`}>
              {repository.language}
            </span>
          )}
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {repository.stars_count}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0zm4.586 13.414a1 1 0 010-1.414L14.586 13H9a7 7 0 01-7-7V4a1 1 0 112 0v2a5 5 0 005 5h5.586l-2.293-2.293a1 1 0 111.414-1.414l3.707 3.707a2 2 0 010 2.828l-3.707 3.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {repository.forks_count}
            </span>
          </div>
        </div>
        <div className="text-right">
          {repository.last_commit_date && (
            <div className="text-xs">
              Updated {formatDate(repository.last_commit_date)}
            </div>
          )}
        </div>
      </div>

      {repository.last_commit_message && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 truncate" title={repository.last_commit_message}>
            Latest: {repository.last_commit_message}
          </p>
        </div>
      )}
    </div>
  );
}