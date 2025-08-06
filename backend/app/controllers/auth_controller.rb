class AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [:github_callback]

  def github_callback
    access_token = params[:access_token]
    
    if access_token.blank?
      render json: { error: 'Access token is required' }, status: :bad_request
      return
    end

    begin
      client = Octokit::Client.new(access_token: access_token)
      github_user = client.user
      
      # Debug: ログでGitHubユーザー情報を確認
      Rails.logger.info "GitHub user data: #{github_user.inspect}"
      
      # GitHubから取得したデータを確認してハッシュに変換
      user_data = {
        'id' => github_user.id,
        'login' => github_user.login,
        'name' => github_user.name,
        'email' => github_user.email,
        'avatar_url' => github_user.avatar_url
      }
      
      Rails.logger.info "Processed user data: #{user_data.inspect}"
      
      user = User.from_github_oauth(user_data, access_token)
      
      if user.persisted?
        token = JwtToken.encode(user_id: user.id)
        
        render json: {
          token: token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url
          }
        }
      else
        Rails.logger.error "User creation failed: #{user.errors.full_messages}"
        render json: { 
          error: 'Failed to create user', 
          details: user.errors.full_messages 
        }, status: :unprocessable_content
      end
    rescue Octokit::Unauthorized
      render json: { error: 'Invalid GitHub access token' }, status: :unauthorized
    rescue => e
      Rails.logger.error "Authentication error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "Authentication failed: #{e.message}" }, status: :internal_server_error
    end
  end

  def me
    render json: {
      user: {
        id: current_user.id,
        username: current_user.username,
        name: current_user.name,
        email: current_user.email,
        avatar_url: current_user.avatar_url
      }
    }
  end
end
