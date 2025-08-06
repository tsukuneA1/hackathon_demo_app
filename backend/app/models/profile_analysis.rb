class ProfileAnalysis < ApplicationRecord
  belongs_to :user
  
  validates :user_id, uniqueness: true
  validates :experience_level, inclusion: { in: %w[Junior Mid Senior Lead] }, allow_blank: true
  
  scope :recent, -> { order(analyzed_at: :desc) }
  scope :by_experience, ->(level) { where(experience_level: level) }
  
  def needs_update?
    return true unless analyzed_at
    analyzed_at < 7.days.ago || user.repositories.where('updated_at > ?', analyzed_at).exists?
  end
  
  def formatted_skills
    skills&.join(', ')
  end
  
  def formatted_technologies  
    technologies&.join(', ')
  end
  
  def formatted_strengths
    strengths&.join(', ')
  end
end
