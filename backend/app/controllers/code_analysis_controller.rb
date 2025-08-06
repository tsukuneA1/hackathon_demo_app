class CodeAnalysisController < ApplicationController
  def analyze_repository
    repository_id = params[:repository_id]
    repository = current_user.repositories.find(repository_id)
    
    begin
      Rails.logger.info "Starting code analysis for repository: #{repository.name}"
      
      git_service = GitAnalysisService.new(current_user)
      git_service.analyze_repository_code(repository)
      repository.reload
      
      render json: {
        message: 'Code analysis completed successfully',
        repository: format_repository_with_analysis(repository)
      }
    rescue => e
      Rails.logger.error "Code analysis failed: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_content
    end
  end

  def repository_insights
    repository_id = params[:repository_id]
    repository = current_user.repositories.find(repository_id)
    
    if repository.analysis_data.present?
      render json: {
        repository: format_repository_with_analysis(repository),
        insights: repository.analysis_data
      }
    else
      render json: { 
        message: 'No analysis data available. Please run code analysis first.',
        repository: format_basic_repository(repository)
      }, status: :not_found
    end
  end

  def commit_analysis
    repository_id = params[:repository_id]
    repository = current_user.repositories.find(repository_id)
    
    begin
      git_service = GitAnalysisService.new(current_user)
      commit_patterns = git_service.analyze_commit_patterns(repository)
      
      render json: {
        repository: format_basic_repository(repository),
        commit_analysis: commit_patterns
      }
    rescue => e
      Rails.logger.error "Commit analysis failed: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_content
    end
  end

  def quality_metrics
    repository_id = params[:repository_id]
    repository = current_user.repositories.find(repository_id)
    
    begin
      git_service = GitAnalysisService.new(current_user)
      metrics = git_service.get_code_quality_metrics(repository)
      
      render json: {
        repository: format_basic_repository(repository),
        quality_metrics: metrics
      }
    rescue => e
      Rails.logger.error "Quality metrics calculation failed: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_content
    end
  end

  def batch_analyze
    repository_ids = params[:repository_ids] || []
    
    if repository_ids.empty?
      render json: { error: 'No repositories specified' }, status: :bad_request
      return
    end
    
    repositories = current_user.repositories.where(id: repository_ids)
    results = []
    
    repositories.each do |repository|
      begin
        git_service = GitAnalysisService.new(current_user)
        git_service.analyze_repository_code(repository)
        repository.reload
        
        results << {
          repository_id: repository.id,
          status: 'success',
          repository: format_repository_with_analysis(repository)
        }
      rescue => e
        Rails.logger.error "Batch analysis failed for #{repository.name}: #{e.message}"
        results << {
          repository_id: repository.id,
          status: 'error',
          error: e.message
        }
      end
    end
    
    render json: {
      message: 'Batch analysis completed',
      results: results
    }
  end

  private

  def format_repository_with_analysis(repository)
    basic_repo = format_basic_repository(repository)
    
    if repository.analysis_data.present?
      basic_repo.merge({
        analysis: {
          total_lines: repository.analysis_data['total_lines'],
          complexity_score: repository.analysis_data['complexity_score'],
          function_count: repository.analysis_data['function_count'],
          class_count: repository.analysis_data['class_count'],
          quality_score: repository.analysis_data['quality_score'],
          complexity_level: repository.analysis_data['complexity_level'],
          maintainability: repository.analysis_data['maintainability'],
          architecture_pattern: repository.analysis_data['architecture_pattern'],
          strengths: repository.analysis_data['strengths'],
          improvements: repository.analysis_data['improvements'],
          tech_insights: repository.analysis_data['tech_insights'],
          analyzed_at: repository.analysis_data['analyzed_at']
        }
      })
    else
      basic_repo
    end
  end

  def format_basic_repository(repository)
    {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      language: repository.language,
      stars_count: repository.stars_count,
      forks_count: repository.forks_count,
      private: repository.private,
      html_url: repository.html_url,
      created_at: repository.created_at,
      updated_at: repository.updated_at
    }
  end
end