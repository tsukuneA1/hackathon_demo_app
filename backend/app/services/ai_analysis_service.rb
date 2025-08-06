class AiAnalysisService
  def initialize(user)
    @user = user
    @client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
  end

  def analyze_profile
    Rails.logger.info "Starting AI analysis for user: #{@user.username}"
    
    begin
      # Gather GitHub data
      github_data = gather_github_data
      
      # Generate AI analysis
      analysis = generate_analysis(github_data)
      
      # Save or update profile analysis
      save_analysis(analysis)
      
      Rails.logger.info "AI analysis completed for user: #{@user.username}"
      @user.profile_analysis
      
    rescue => e
      Rails.logger.error "AI analysis failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise "AI analysis failed: #{e.message}"
    end
  end

  def generate_chat_response(question, context = nil)
    begin
      analysis = @user.profile_analysis
      return "プロフィール分析がまだ完了していません。" unless analysis

      prompt = build_chat_prompt(question, analysis, context)
      
      response = @client.chat(
        parameters: {
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        }
      )
      
      response.dig("choices", 0, "message", "content")
    rescue => e
      Rails.logger.error "Chat response generation failed: #{e.message}"
      "申し訳ありません。現在回答を生成できません。"
    end
  end

  private

  def gather_github_data
    repos = @user.repositories.includes(:user)
    
    # Repository statistics
    total_repos = repos.count
    public_repos = repos.public_repos.count
    languages = repos.map(&:language).compact.uniq
    total_stars = repos.sum(:stars_count)
    total_forks = repos.sum(:forks_count)
    
    # Recent activity
    recent_commits = repos.where('last_commit_date > ?', 3.months.ago).count
    
    # Popular repositories
    popular_repos = repos.popular.limit(5).map do |repo|
      {
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stars_count,
        recent_commit: repo.last_commit_message
      }
    end
    
    # README analysis (first 1000 chars from each repo)
    readme_samples = repos.where.not(readme_content: nil)
                          .limit(3)
                          .map { |r| r.readme_content&.truncate(1000) }
                          .compact
    
    {
      user_info: {
        username: @user.username,
        name: @user.name
      },
      repository_stats: {
        total_repos: total_repos,
        public_repos: public_repos,
        languages: languages,
        total_stars: total_stars,
        total_forks: total_forks,
        recent_commits: recent_commits
      },
      popular_repositories: popular_repos,
      readme_samples: readme_samples
    }
  end

  def generate_analysis(github_data)
    prompt = build_analysis_prompt(github_data)
    
    response = @client.chat(
      parameters: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.3
      }
    )
    
    content = response.dig("choices", 0, "message", "content")
    parse_analysis_response(content)
  end

  def build_analysis_prompt(data)
    <<~PROMPT
      以下のGitHubデータに基づいて、このソフトウェアエンジニアの詳細プロフィール分析を行ってください。
      
      【ユーザー情報】
      - ユーザー名: #{data[:user_info][:username]}
      - 名前: #{data[:user_info][:name]}
      
      【リポジトリ統計】
      - 総リポジトリ数: #{data[:repository_stats][:total_repos]}
      - 公開リポジトリ数: #{data[:repository_stats][:public_repos]}  
      - 使用言語: #{data[:repository_stats][:languages].join(', ')}
      - 総スター数: #{data[:repository_stats][:total_stars]}
      - 総フォーク数: #{data[:repository_stats][:total_forks]}
      - 最近3ヶ月のコミット数: #{data[:repository_stats][:recent_commits]}
      
      【主要リポジトリ】
      #{data[:popular_repositories].map { |r| "- #{r[:name]} (#{r[:language]}): #{r[:description]}" }.join("\n")}
      
      【README サンプル】
      #{data[:readme_samples].join("\n---\n")}
      
      上記の情報を基に、以下の形式で分析結果を返してください：
      
      SUMMARY: [2-3文での総合的な人物像]
      SKILLS: [主要スキルをカンマ区切りで]
      TECHNOLOGIES: [使用技術をカンマ区切りで]
      EXPERIENCE: [Junior/Mid/Senior/Leadのいずれか]
      PERSONALITY: [プログラミングスタイルや特徴]
      STRENGTHS: [強みをカンマ区切りで]
      COMMUNICATION: [コミュニケーションスタイルの推測]
    PROMPT
  end

  def parse_analysis_response(content)
    analysis = {}
    
    content.scan(/SUMMARY:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:summary] = $1.strip }
    content.scan(/SKILLS:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:skills] = $1.split(',').map(&:strip) }
    content.scan(/TECHNOLOGIES:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:technologies] = $1.split(',').map(&:strip) }
    content.scan(/EXPERIENCE:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:experience_level] = $1.strip }
    content.scan(/PERSONALITY:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:personality] = $1.strip }
    content.scan(/STRENGTHS:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:strengths] = $1.split(',').map(&:strip) }
    content.scan(/COMMUNICATION:\s*(.+?)(?=\n[A-Z]+:|$)/m) { analysis[:communication_style] = $1.strip }
    
    analysis
  end

  def save_analysis(analysis_data)
    profile_analysis = @user.profile_analysis || @user.build_profile_analysis
    
    profile_analysis.assign_attributes(
      summary: analysis_data[:summary],
      skills: analysis_data[:skills],
      technologies: analysis_data[:technologies],
      experience_level: analysis_data[:experience_level],
      personality: analysis_data[:personality],
      strengths: analysis_data[:strengths],
      communication_style: analysis_data[:communication_style],
      analyzed_at: Time.current
    )
    
    profile_analysis.save!
  end

  def build_chat_prompt(question, analysis, context)
    <<~PROMPT
      あなたは#{@user.name || @user.username}というソフトウェアエンジニアについて詳しく知っているAIアシスタントです。
      以下の分析情報に基づいて、質問に答えてください：

      【基本情報】
      - 名前: #{@user.name || @user.username}
      - 経験レベル: #{analysis.experience_level}
      - 要約: #{analysis.summary}

      【スキル・技術】  
      - 主要スキル: #{analysis.formatted_skills}
      - 使用技術: #{analysis.formatted_technologies}
      - 強み: #{analysis.formatted_strengths}

      【特徴】
      - パーソナリティ: #{analysis.personality}
      - コミュニケーションスタイル: #{analysis.communication_style}

      質問: #{question}

      #{context ? "追加コンテキスト: #{context}" : ""}

      回答は親しみやすく、具体的で、相手が#{@user.name || @user.username}さんに興味を持てるような内容にしてください。
      200文字以内で回答してください。
    PROMPT
  end
end