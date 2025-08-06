class GitAnalysisService
  def initialize(user)
    @user = user
    @client = Octokit::Client.new(access_token: @user.access_token)
    @ai_client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
  end

  def analyze_repository_code(repository)
    Rails.logger.info "Starting deep code analysis for repository: #{repository.name}"
    
    begin
      # Get repository content structure
      content_structure = get_repository_structure(repository)
      
      # Analyze code files
      code_analysis = analyze_code_files(repository, content_structure)
      
      # Generate AI insights
      ai_insights = generate_code_insights(repository, code_analysis)
      
      # Update repository with analysis results
      update_repository_analysis(repository, code_analysis, ai_insights)
      
      Rails.logger.info "Code analysis completed for repository: #{repository.name}"
      
    rescue => e
      Rails.logger.error "Code analysis failed for #{repository.name}: #{e.message}"
      raise "Code analysis failed: #{e.message}"
    end
  end

  def get_code_quality_metrics(repository)
    if repository.analysis_data.present?
      {
        complexity_score: repository.analysis_data['complexity_score'] || 0,
        maintainability_index: get_maintainability_score(repository.analysis_data['maintainability']),
        quality_score: repository.analysis_data['quality_score'] || 0,
        total_lines: repository.analysis_data['total_lines'] || 0,
        function_count: repository.analysis_data['function_count'] || 0
      }
    else
      {
        complexity_score: 0,
        maintainability_index: 0,
        quality_score: 0,
        total_lines: 0,
        function_count: 0,
        message: 'No analysis data available. Please run code analysis first.'
      }
    end
  end

  def analyze_commit_patterns(repository)
    begin
      # Get recent commits (last 100)
      commits = @client.commits(@user.username + '/' + repository.name, per_page: 100)
      
      commit_analysis = {
        total_commits: commits.size,
        commit_frequency: calculate_commit_frequency(commits),
        commit_message_quality: analyze_commit_messages(commits),
        contributor_activity: analyze_contributors(commits),
        code_churn: calculate_code_churn(commits)
      }
      
      commit_analysis
    rescue => e
      Rails.logger.error "Commit analysis failed: #{e.message}"
      {}
    end
  end

  private

  def get_repository_structure(repository)
    tree = @client.tree(@user.username + '/' + repository.name, 'HEAD', recursive: true)
    
    structure = {
      total_files: tree.tree.size,
      file_types: {},
      directories: [],
      code_files: []
    }
    
    tree.tree.each do |item|
      if item.type == 'blob'
        extension = File.extname(item.path).downcase
        structure[:file_types][extension] = (structure[:file_types][extension] || 0) + 1
        
        # Collect code files for analysis
        if code_file?(extension)
          structure[:code_files] << {
            path: item.path,
            sha: item.sha,
            size: item.size
          }
        end
      elsif item.type == 'tree'
        structure[:directories] << item.path
      end
    end
    
    structure
  end

  def analyze_code_files(repository, structure)
    analysis = {
      total_lines: 0,
      code_complexity: 0,
      function_count: 0,
      class_count: 0,
      file_analyses: []
    }
    
    # Analyze up to 10 largest code files to avoid API limits
    code_files = structure[:code_files].sort_by { |f| f[:size] || 0 }.reverse.first(10)
    
    code_files.each do |file|
      begin
        content = @client.contents(@user.username + '/' + repository.name, path: file[:path])
        file_content = Base64.decode64(content.content)
        
        file_analysis = analyze_single_file(file[:path], file_content)
        analysis[:file_analyses] << file_analysis
        
        analysis[:total_lines] += file_analysis[:lines]
        analysis[:code_complexity] += file_analysis[:complexity]
        analysis[:function_count] += file_analysis[:functions]
        analysis[:class_count] += file_analysis[:classes]
        
      rescue => e
        Rails.logger.warn "Could not analyze file #{file[:path]}: #{e.message}"
      end
    end
    
    analysis
  end

  def analyze_single_file(path, content)
    lines = content.split("\n")
    extension = File.extname(path).downcase
    
    analysis = {
      path: path,
      lines: lines.size,
      complexity: 0,
      functions: 0,
      classes: 0,
      comments: 0
    }
    
    case extension
    when '.rb'
      analyze_ruby_file(lines, analysis)
    when '.js', '.ts', '.jsx', '.tsx'
      analyze_javascript_file(lines, analysis)
    when '.py'
      analyze_python_file(lines, analysis)
    when '.java'
      analyze_java_file(lines, analysis)
    else
      analyze_generic_file(lines, analysis)
    end
    
    analysis
  end

  def analyze_ruby_file(lines, analysis)
    lines.each do |line|
      line = line.strip
      analysis[:comments] += 1 if line.start_with?('#')
      analysis[:classes] += 1 if line.match(/^class\s+\w+/)
      analysis[:functions] += 1 if line.match(/^def\s+\w+/)
      analysis[:complexity] += 1 if line.match(/\b(if|unless|while|until|for|case)\b/)
    end
  end

  def analyze_javascript_file(lines, analysis)
    lines.each do |line|
      line = line.strip
      analysis[:comments] += 1 if line.start_with?('//') || line.start_with?('/*')
      analysis[:classes] += 1 if line.match(/^(class|export class)\s+\w+/)
      analysis[:functions] += 1 if line.match(/(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*:\s*function)/)
      analysis[:complexity] += 1 if line.match(/\b(if|for|while|switch|catch)\b/)
    end
  end

  def analyze_python_file(lines, analysis)
    lines.each do |line|
      line = line.strip
      analysis[:comments] += 1 if line.start_with?('#')
      analysis[:classes] += 1 if line.match(/^class\s+\w+/)
      analysis[:functions] += 1 if line.match(/^def\s+\w+/)
      analysis[:complexity] += 1 if line.match(/\b(if|elif|for|while|try|except)\b/)
    end
  end

  def analyze_java_file(lines, analysis)
    lines.each do |line|
      line = line.strip
      analysis[:comments] += 1 if line.start_with?('//') || line.start_with?('/*')
      analysis[:classes] += 1 if line.match(/^(public\s+|private\s+|protected\s+)?class\s+\w+/)
      analysis[:functions] += 1 if line.match(/(public\s+|private\s+|protected\s+).*\s+\w+\s*\([^)]*\)\s*\{/)
      analysis[:complexity] += 1 if line.match(/\b(if|for|while|switch|catch)\b/)
    end
  end

  def analyze_generic_file(lines, analysis)
    # Basic analysis for unknown file types
    lines.each do |line|
      line = line.strip
      analysis[:complexity] += 1 if line.match(/\b(if|for|while)\b/)
    end
  end

  def generate_code_insights(repository, code_analysis)
    prompt = build_code_analysis_prompt(repository, code_analysis)
    
    response = @ai_client.chat(
      parameters: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      }
    )
    
    content = response.dig("choices", 0, "message", "content")
    parse_code_insights(content)
  end

  def build_code_analysis_prompt(repository, analysis)
    <<~PROMPT
      リポジトリ「#{repository.name}」のコード分析結果に基づいて、技術的な洞察を提供してください。

      【基本情報】
      - リポジトリ名: #{repository.name}
      - 主要言語: #{repository.language}
      - 説明: #{repository.description}

      【コード分析結果】
      - 総行数: #{analysis[:total_lines]}
      - 総複雑度: #{analysis[:code_complexity]}
      - 関数数: #{analysis[:function_count]}
      - クラス数: #{analysis[:class_count]}
      - 分析ファイル数: #{analysis[:file_analyses].size}

      【ファイル詳細】
      #{analysis[:file_analyses].map { |f| "- #{f[:path]}: #{f[:lines]}行, 複雑度#{f[:complexity]}" }.join("\n")}

      以下の形式で分析結果を返してください：

      QUALITY_SCORE: [1-10の品質スコア]
      COMPLEXITY_LEVEL: [Low/Medium/High]
      MAINTAINABILITY: [Poor/Fair/Good/Excellent]
      ARCHITECTURE_PATTERN: [使用されているアーキテクチャパターン]
      STRENGTHS: [コードの強み]
      IMPROVEMENTS: [改善提案]
      TECH_INSIGHTS: [技術的な洞察]
    PROMPT
  end

  def parse_code_insights(content)
    insights = {}
    
    content.scan(/QUALITY_SCORE:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:quality_score] = $1.strip.to_i }
    content.scan(/COMPLEXITY_LEVEL:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:complexity_level] = $1.strip }
    content.scan(/MAINTAINABILITY:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:maintainability] = $1.strip }
    content.scan(/ARCHITECTURE_PATTERN:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:architecture_pattern] = $1.strip }
    content.scan(/STRENGTHS:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:strengths] = $1.strip }
    content.scan(/IMPROVEMENTS:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:improvements] = $1.strip }
    content.scan(/TECH_INSIGHTS:\s*(.+?)(?=\n[A-Z_]+:|$)/m) { insights[:tech_insights] = $1.strip }
    
    insights
  end

  def update_repository_analysis(repository, code_analysis, ai_insights)
    analysis_data = {
      total_lines: code_analysis[:total_lines],
      complexity_score: code_analysis[:code_complexity],
      function_count: code_analysis[:function_count],
      class_count: code_analysis[:class_count],
      quality_score: ai_insights[:quality_score],
      complexity_level: ai_insights[:complexity_level],
      maintainability: ai_insights[:maintainability],
      architecture_pattern: ai_insights[:architecture_pattern],
      strengths: ai_insights[:strengths],
      improvements: ai_insights[:improvements],
      tech_insights: ai_insights[:tech_insights],
      analyzed_at: Time.current
    }
    
    repository.update!(analysis_data: analysis_data)
  end

  def code_file?(extension)
    code_extensions = %w[.rb .js .ts .jsx .tsx .py .java .cpp .c .cs .php .go .rs .swift .kt]
    code_extensions.include?(extension)
  end

  def calculate_commit_frequency(commits)
    return 0 if commits.empty?
    
    first_commit = commits.last.commit.author.date
    last_commit = commits.first.commit.author.date
    days_diff = (last_commit - first_commit) / 1.day
    
    days_diff > 0 ? (commits.size / days_diff).round(2) : 0
  end

  def analyze_commit_messages(commits)
    good_messages = commits.count { |c| c.commit.message.length > 20 && !c.commit.message.match(/^(fix|update|change)$/i) }
    (good_messages.to_f / commits.size * 100).round(1)
  end

  def analyze_contributors(commits)
    contributors = commits.group_by { |c| c.commit.author.email }.transform_values(&:size)
    {
      total_contributors: contributors.size,
      main_contributor_percentage: contributors.values.max.to_f / commits.size * 100
    }
  end

  def calculate_code_churn(commits)
    total_additions = commits.sum { |c| c.stats&.additions || 0 }
    total_deletions = commits.sum { |c| c.stats&.deletions || 0 }
    
    {
      total_additions: total_additions,
      total_deletions: total_deletions,
      churn_ratio: total_deletions > 0 ? (total_deletions.to_f / total_additions).round(2) : 0
    }
  end

  def get_maintainability_score(level)
    case level&.downcase
    when 'excellent' then 10
    when 'good' then 8
    when 'fair' then 6
    when 'poor' then 3
    else 0
    end
  end
end