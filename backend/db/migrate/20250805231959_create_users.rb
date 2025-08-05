class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.integer :github_id, null: false
      t.string :username, null: false
      t.string :name
      t.string :email
      t.string :avatar_url
      t.string :access_token

      t.timestamps
    end
    
    add_index :users, :github_id, unique: true
    add_index :users, :username, unique: true
  end
end
