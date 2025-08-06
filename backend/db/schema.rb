# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_06_001050) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "profile_analyses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "summary"
    t.json "skills"
    t.json "technologies"
    t.string "experience_level"
    t.text "personality"
    t.json "strengths"
    t.text "communication_style"
    t.datetime "analyzed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["analyzed_at"], name: "index_profile_analyses_on_analyzed_at"
    t.index ["experience_level"], name: "index_profile_analyses_on_experience_level"
    t.index ["user_id"], name: "index_profile_analyses_on_user_id"
  end

  create_table "repositories", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "github_id", null: false
    t.string "name", null: false
    t.string "full_name", null: false
    t.text "description"
    t.boolean "private", default: false
    t.string "language"
    t.integer "stars_count", default: 0
    t.integer "forks_count", default: 0
    t.string "default_branch"
    t.string "clone_url"
    t.string "html_url"
    t.text "readme_content"
    t.string "last_commit_sha"
    t.text "last_commit_message"
    t.datetime "last_commit_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["github_id"], name: "index_repositories_on_github_id", unique: true
    t.index ["language"], name: "index_repositories_on_language"
    t.index ["stars_count"], name: "index_repositories_on_stars_count"
    t.index ["user_id", "name"], name: "index_repositories_on_user_id_and_name"
    t.index ["user_id"], name: "index_repositories_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.integer "github_id", null: false
    t.string "username", null: false
    t.string "name"
    t.string "email"
    t.string "avatar_url"
    t.string "access_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["github_id"], name: "index_users_on_github_id", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "profile_analyses", "users"
  add_foreign_key "repositories", "users"
end
