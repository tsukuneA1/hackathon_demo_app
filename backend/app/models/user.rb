class User < ApplicationRecord
  has_many :repositories, dependent: :destroy
  
  validates :github_id, presence: true, uniqueness: true
  validates :username, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  
  def self.from_github_oauth(github_user, access_token)
    Rails.logger.info "Attempting to find or create user with GitHub ID: #{github_user['id']}"
    
    user = find_or_initialize_by(github_id: github_user['id'])
    
    # 既存ユーザーの場合はaccess_tokenだけ更新
    if user.persisted?
      user.update(access_token: access_token)
      return user
    end
    
    # 新規ユーザーの場合
    user.assign_attributes(
      username: github_user['login'],
      name: github_user['name'],
      email: github_user['email'],
      avatar_url: github_user['avatar_url'],
      access_token: access_token
    )
    
    Rails.logger.info "User attributes before save: #{user.attributes}"
    
    if user.save
      Rails.logger.info "User saved successfully"
    else
      Rails.logger.error "User save failed: #{user.errors.full_messages}"
    end
    
    user
  end
end
