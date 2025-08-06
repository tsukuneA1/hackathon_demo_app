class NetworkingController < ApplicationController
  def discover_engineers
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 20
    skills_filter = params[:skills]&.split(',')&.map(&:strip) || []
    experience_filter = params[:experience_level]
    technology_filter = params[:technology]
    
    # Build the query
    users_query = User.joins(:profile_analysis)
                     .where.not(id: current_user.id)
                     .includes(:profile_analysis, :repositories)
    
    # Apply filters
    if skills_filter.any?
      skills_conditions = skills_filter.map { "profile_analyses.skills @> ?" }
      users_query = users_query.where(skills_conditions.join(' OR '), *skills_filter.map(&:to_json))
    end
    
    users_query = users_query.where(profile_analyses: { experience_level: experience_filter }) if experience_filter.present?
    
    if technology_filter.present?
      users_query = users_query.where("profile_analyses.technologies @> ?", [technology_filter].to_json)
    end
    
    # Paginate results
    total_count = users_query.count
    users = users_query.offset((page - 1) * per_page).limit(per_page)
    
    engineers = users.map do |user|
      format_engineer_profile(user)
    end
    
    render json: {
      engineers: engineers,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count / per_page.to_f).ceil
      },
      filters: {
        skills: skills_filter,
        experience_level: experience_filter,
        technology: technology_filter
      }
    }
  end

  def engineer_profile
    engineer_id = params[:id]
    engineer = User.includes(:profile_analysis, :repositories).find(engineer_id)
    
    if engineer.id == current_user.id
      render json: { error: 'Cannot view your own profile through this endpoint' }, status: :forbidden
      return
    end
    
    profile = format_detailed_engineer_profile(engineer)
    
    render json: {
      engineer: profile
    }
  end

  def chat_with_engineer
    engineer_id = params[:engineer_id]
    question = params[:question]
    context = params[:context]
    
    if question.blank?
      render json: { error: 'Question is required' }, status: :bad_request
      return
    end
    
    engineer = User.includes(:profile_analysis).find(engineer_id)
    
    if engineer.id == current_user.id
      render json: { error: 'Cannot chat about your own profile' }, status: :forbidden
      return
    end
    
    unless engineer.profile_analysis
      render json: { error: 'Engineer profile analysis not available' }, status: :not_found
      return
    end
    
    begin
      ai_service = AiAnalysisService.new(engineer)
      response = ai_service.generate_chat_response(question, context)
      
      render json: {
        question: question,
        answer: response,
        engineer: {
          id: engineer.id,
          username: engineer.username,
          name: engineer.name,
          avatar_url: engineer.avatar_url
        },
        asked_by: {
          id: current_user.id,
          username: current_user.username,
          name: current_user.name
        }
      }
    rescue => e
      Rails.logger.error "Chat with engineer failed: #{e.message}"
      render json: { error: 'Failed to generate response' }, status: :unprocessable_content
    end
  end

  def similar_engineers
    # Find engineers with similar skills and technologies
    return render json: { engineers: [] } unless current_user.profile_analysis
    
    current_skills = current_user.profile_analysis.skills || []
    current_technologies = current_user.profile_analysis.technologies || []
    
    if current_skills.empty? && current_technologies.empty?
      return render json: { 
        engineers: [],
        message: 'Complete your profile analysis to find similar engineers'
      }
    end
    
    similar_users = User.joins(:profile_analysis)
                       .where.not(id: current_user.id)
                       .includes(:profile_analysis, :repositories)
                       .limit(10)
    
    # Calculate similarity scores and sort
    engineers_with_scores = similar_users.map do |user|
      similarity_score = calculate_similarity_score(
        current_skills, current_technologies,
        user.profile_analysis.skills || [], user.profile_analysis.technologies || []
      )
      
      next if similarity_score < 0.1 # Skip if too dissimilar
      
      engineer_data = format_engineer_profile(user)
      engineer_data[:similarity_score] = (similarity_score * 100).round(1)
      engineer_data
    end.compact.sort_by { |e| -e[:similarity_score] }
    
    render json: {
      engineers: engineers_with_scores,
      message: engineers_with_scores.empty? ? 'No similar engineers found' : nil
    }
  end

  def trending_skills
    # Get most common skills across all engineers
    skills_count = ProfileAnalysis.where.not(skills: nil)
                                 .pluck(:skills)
                                 .flatten
                                 .each_with_object(Hash.new(0)) { |skill, count| count[skill] += 1 }
                                 .sort_by { |_, count| -count }
                                 .first(20)
    
    technologies_count = ProfileAnalysis.where.not(technologies: nil)
                                       .pluck(:technologies)
                                       .flatten
                                       .each_with_object(Hash.new(0)) { |tech, count| count[tech] += 1 }
                                       .sort_by { |_, count| -count }
                                       .first(20)
    
    render json: {
      trending_skills: skills_count.map { |skill, count| { name: skill, count: count } },
      trending_technologies: technologies_count.map { |tech, count| { name: tech, count: count } }
    }
  end

  private

  def format_engineer_profile(user)
    analysis = user.profile_analysis
    
    profile = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      repository_count: user.repositories.count,
      total_stars: user.repositories.sum(:stars_count)
    }
    
    if analysis
      profile.merge!({
        summary: analysis.summary,
        skills: analysis.skills || [],
        technologies: analysis.technologies || [],
        experience_level: analysis.experience_level,
        personality: analysis.personality,
        strengths: analysis.strengths || [],
        communication_style: analysis.communication_style,
        analyzed_at: analysis.analyzed_at
      })
    end
    
    profile
  end

  def format_detailed_engineer_profile(user)
    basic_profile = format_engineer_profile(user)
    
    # Add repository information
    repositories = user.repositories.popular.limit(5).map do |repo|
      {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars_count: repo.stars_count,
        forks_count: repo.forks_count,
        html_url: repo.html_url,
        analysis_data: repo.analysis_data
      }
    end
    
    basic_profile.merge({
      top_repositories: repositories,
      languages_used: user.repositories.where.not(language: nil).group(:language).count.sort_by { |_, count| -count }.first(5)
    })
  end

  def calculate_similarity_score(skills1, techs1, skills2, techs2)
    # Simple Jaccard similarity
    skills_intersection = (skills1 & skills2).size
    skills_union = (skills1 | skills2).size
    skills_similarity = skills_union > 0 ? skills_intersection.to_f / skills_union : 0
    
    techs_intersection = (techs1 & techs2).size
    techs_union = (techs1 | techs2).size
    techs_similarity = techs_union > 0 ? techs_intersection.to_f / techs_union : 0
    
    # Weighted average (skills are slightly more important)
    (skills_similarity * 0.6 + techs_similarity * 0.4)
  end
end