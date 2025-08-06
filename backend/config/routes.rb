Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Authentication routes
  post '/auth/github', to: 'auth#github_callback'
  get '/auth/me', to: 'auth#me'

  # Repository routes
  resources :repositories, only: [:index, :show] do
    collection do
      post :sync
    end
  end

  # Profile Analysis routes
  resource :profile_analysis, only: [:show, :create] do
    post :chat
  end

  # Code Analysis routes
  resources :code_analysis, only: [] do
    collection do
      post :batch_analyze
    end
    member do
      post :analyze_repository
      get :repository_insights
      get :commit_analysis
      get :quality_metrics
    end
  end

  # Networking routes
  resources :networking, only: [] do
    collection do
      get :discover_engineers
      get :similar_engineers
      get :trending_skills
      post :chat_with_engineer
    end
    member do
      get :engineer_profile
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
