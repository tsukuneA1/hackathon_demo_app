class ProfileAnalysesController < ApplicationController
  def show
    analysis = current_user.profile_analysis
    
    if analysis
      render json: {
        profile_analysis: format_analysis(analysis)
      }
    else
      render json: { message: 'Profile analysis not found. Please run analysis first.' }, status: :not_found
    end
  end

  def create
    begin
      Rails.logger.info "Starting profile analysis for user: #{current_user.username}"
      
      ai_service = AiAnalysisService.new(current_user)
      analysis = ai_service.analyze_profile
      
      render json: {
        message: 'Profile analysis completed successfully',
        profile_analysis: format_analysis(analysis)
      }
    rescue => e
      Rails.logger.error "Profile analysis failed: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_content
    end
  end

  def chat
    question = params[:question]
    context = params[:context]
    
    if question.blank?
      render json: { error: 'Question is required' }, status: :bad_request
      return
    end

    begin
      ai_service = AiAnalysisService.new(current_user)
      response = ai_service.generate_chat_response(question, context)
      
      render json: {
        question: question,
        answer: response,
        user: {
          username: current_user.username,
          name: current_user.name,
          avatar_url: current_user.avatar_url
        }
      }
    rescue => e
      Rails.logger.error "Chat response generation failed: #{e.message}"
      render json: { error: 'Failed to generate response' }, status: :unprocessable_content
    end
  end

  private

  def format_analysis(analysis)
    {
      id: analysis.id,
      summary: analysis.summary,
      skills: analysis.skills,
      technologies: analysis.technologies,
      experience_level: analysis.experience_level,
      personality: analysis.personality,
      strengths: analysis.strengths,
      communication_style: analysis.communication_style,
      analyzed_at: analysis.analyzed_at,
      needs_update: analysis.needs_update?,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at
    }
  end
end
