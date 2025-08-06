class CreateRepositories < ActiveRecord::Migration[8.0]
  def change
    create_table :repositories do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :github_id, null: false
      t.string :name, null: false
      t.string :full_name, null: false
      t.text :description
      t.boolean :private, default: false
      t.string :language
      t.integer :stars_count, default: 0
      t.integer :forks_count, default: 0
      t.string :default_branch
      t.string :clone_url
      t.string :html_url
      t.text :readme_content
      t.string :last_commit_sha
      t.text :last_commit_message
      t.datetime :last_commit_date

      t.timestamps
    end
    
    add_index :repositories, :github_id, unique: true
    add_index :repositories, [:user_id, :name]
    add_index :repositories, :language
    add_index :repositories, :stars_count
  end
end
