class GithubService
  def initialize(user)
    @user = user
    @client = Octokit::Client.new(access_token: user.access_token)
  end

  def sync_repositories
    Rails.logger.info "Starting repository sync for user: #{@user.username}"
    
    begin
      # GitHubからリポジトリ一覧を取得
      repos = @client.repositories(@user.username, per_page: 100)
      synced_repos = []
      
      repos.each do |repo_data|
        repository = Repository.from_github_data(@user, repo_data.to_h)
        
        # README取得
        fetch_readme(repository)
        
        # 最新コミット情報取得
        fetch_latest_commit(repository)
        
        if repository.save
          synced_repos << repository
          Rails.logger.info "Synced repository: #{repository.full_name}"
        else
          Rails.logger.error "Failed to save repository #{repository.full_name}: #{repository.errors.full_messages}"
        end
      end
      
      Rails.logger.info "Repository sync completed. Synced #{synced_repos.count} repositories"
      synced_repos
      
    rescue Octokit::Unauthorized
      Rails.logger.error "GitHub API unauthorized for user: #{@user.username}"
      raise "GitHub access token is invalid or expired"
    rescue => e
      Rails.logger.error "GitHub API error: #{e.message}"
      raise "Failed to sync repositories: #{e.message}"
    end
  end

  def fetch_user_info
    begin
      github_user = @client.user
      {
        login: github_user.login,
        name: github_user.name,
        bio: github_user.bio,
        company: github_user.company,
        location: github_user.location,
        blog: github_user.blog,
        public_repos: github_user.public_repos,
        followers: github_user.followers,
        following: github_user.following
      }
    rescue => e
      Rails.logger.error "Failed to fetch user info: #{e.message}"
      nil
    end
  end

  private

  def fetch_readme(repository)
    begin
      readme = @client.readme(repository.full_name)
      repository.readme_content = Base64.decode64(readme.content) if readme.content
    rescue Octokit::NotFound
      Rails.logger.info "No README found for #{repository.full_name}"
    rescue => e
      Rails.logger.warn "Failed to fetch README for #{repository.full_name}: #{e.message}"
    end
  end

  def fetch_latest_commit(repository)
    begin
      commits = @client.commits(repository.full_name, per_page: 1)
      if commits.any?
        latest_commit = commits.first
        repository.update_commit_info(latest_commit.to_h)
      end
    rescue => e
      Rails.logger.warn "Failed to fetch latest commit for #{repository.full_name}: #{e.message}"
    end
  end
end