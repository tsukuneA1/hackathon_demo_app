class ApplicationController < ActionController::API
  before_action :authenticate_request

  private

  def authenticate_request
    header = request.headers['Authorization']
    Rails.logger.info "Authorization header: #{header}"
    
    header = header.split(' ').last if header
    Rails.logger.info "Extracted token: #{header}"
    
    if header
      decoded = JwtToken.decode(header)
      Rails.logger.info "Decoded JWT: #{decoded}"
      @current_user = User.find(decoded[:user_id]) if decoded
      Rails.logger.info "Found user: #{@current_user&.username}"
    end
    
    unless @current_user
      Rails.logger.error "Authentication failed - no current user"
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "User not found: #{e.message}"
    render json: { error: 'User not found' }, status: :unauthorized
  end

  def current_user
    @current_user
  end
end
