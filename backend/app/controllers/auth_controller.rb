class AuthController < ApplicationController
  skip_before_action :authenticate_request

  def github_callback
    access_token = params[:access_token]
    
    if access_token.blank?
      render json: { error: 'Access token is required' }, status: :bad_request
      return
    end

    begin
      client = Octokit::Client.new(access_token: access_token)
      github_user = client.user
      
      user = User.from_github_oauth(github_user.to_h, access_token)
      
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
        render json: { error: 'Failed to create user' }, status: :unprocessable_entity
      end
    rescue Octokit::Unauthorized
      render json: { error: 'Invalid GitHub access token' }, status: :unauthorized
    rescue => e
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
