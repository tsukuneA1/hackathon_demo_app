class RepositoriesController < ApplicationController
  def index
    repositories = current_user.repositories.includes(:user)
    
    # フィルタリングオプション
    repositories = repositories.by_language(params[:language]) if params[:language].present?
    repositories = repositories.public_repos if params[:public_only] == 'true'
    
    # ソートオプション
    case params[:sort]
    when 'popular'
      repositories = repositories.popular
    when 'recent'
      repositories = repositories.recent
    else
      repositories = repositories.order(:name)
    end
    
    render json: {
      repositories: repositories.map do |repo|
        {
          id: repo.id,
          github_id: repo.github_id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          language: repo.language,
          stars_count: repo.stars_count,
          forks_count: repo.forks_count,
          html_url: repo.html_url,
          last_commit_message: repo.last_commit_message,
          last_commit_date: repo.last_commit_date,
          updated_at: repo.updated_at
        }
      end
    }
  end

  def show
    repository = current_user.repositories.find(params[:id])
    
    render json: {
      repository: {
        id: repository.id,
        github_id: repository.github_id,
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        private: repository.private,
        language: repository.language,
        stars_count: repository.stars_count,
        forks_count: repository.forks_count,
        default_branch: repository.default_branch,
        clone_url: repository.clone_url,
        html_url: repository.html_url,
        readme_content: repository.readme_content,
        last_commit_sha: repository.last_commit_sha,
        last_commit_message: repository.last_commit_message,
        last_commit_date: repository.last_commit_date,
        created_at: repository.created_at,
        updated_at: repository.updated_at
      }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Repository not found' }, status: :not_found
  end

  def sync
    begin
      Rails.logger.info "Starting repository sync for user: #{current_user.username}"
      github_service = GithubService.new(current_user)
      repositories = github_service.sync_repositories
      
      render json: {
        message: 'Repository sync completed successfully',
        synced_count: repositories.count,
        repositories: repositories.map do |repo|
          {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            language: repo.language,
            stars_count: repo.stars_count
          }
        end
      }
    rescue => e
      Rails.logger.error "Repository sync failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: e.message }, status: :unprocessable_content
    end
  end
end
