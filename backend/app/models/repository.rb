class Repository < ApplicationRecord
  belongs_to :user
  
  validates :github_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :full_name, presence: true
  validates :stars_count, :forks_count, numericality: { greater_than_or_equal_to: 0 }
  
  scope :public_repos, -> { where(private: false) }
  scope :private_repos, -> { where(private: true) }
  scope :by_language, ->(language) { where(language: language) }
  scope :popular, -> { order(stars_count: :desc) }
  scope :recent, -> { order(last_commit_date: :desc) }
  
  def self.from_github_data(user, repo_data)
    Rails.logger.info "Creating repository from data: ID=#{repo_data['id']}, Name=#{repo_data['name']}"
    
    # Ensure repo_data keys are strings for consistent access
    repo_data = repo_data.transform_keys(&:to_s)
    
    find_or_initialize_by(github_id: repo_data['id']).tap do |repo|
      repo.user = user
      repo.name = repo_data['name']
      repo.full_name = repo_data['full_name']
      repo.description = repo_data['description']
      repo.private = repo_data['private'] || false
      repo.language = repo_data['language']
      repo.stars_count = repo_data['stargazers_count'] || 0
      repo.forks_count = repo_data['forks_count'] || 0
      repo.default_branch = repo_data['default_branch']
      repo.clone_url = repo_data['clone_url']
      repo.html_url = repo_data['html_url']
      
      Rails.logger.info "Repository attributes: #{repo.attributes}"
    end
  end
  
  def update_commit_info(commit_data)
    return unless commit_data
    
    self.last_commit_sha = commit_data['sha']
    self.last_commit_message = commit_data.dig('commit', 'message')
    self.last_commit_date = commit_data.dig('commit', 'committer', 'date')
  end
end
