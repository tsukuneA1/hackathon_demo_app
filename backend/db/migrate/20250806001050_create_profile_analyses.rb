class CreateProfileAnalyses < ActiveRecord::Migration[8.0]
  def change
    create_table :profile_analyses do |t|
      t.references :user, null: false, foreign_key: true
      t.text :summary
      t.json :skills # Store as JSON array
      t.json :technologies # Store as JSON array  
      t.string :experience_level
      t.text :personality
      t.json :strengths # Store as JSON array
      t.text :communication_style
      t.datetime :analyzed_at

      t.timestamps
    end
    
    add_index :profile_analyses, :experience_level
    add_index :profile_analyses, :analyzed_at
  end
end
