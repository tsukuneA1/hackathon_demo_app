class User < ApplicationRecord
  validates :github_id, presence: true, uniqueness: true
  validates :username, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  
  def self.from_github_oauth(github_user, access_token)
    find_or_create_by(github_id: github_user['id']) do |user|
      user.username = github_user['login']
      user.name = github_user['name']
      user.email = github_user['email']
      user.avatar_url = github_user['avatar_url']
      user.access_token = access_token
    end
  end
end
