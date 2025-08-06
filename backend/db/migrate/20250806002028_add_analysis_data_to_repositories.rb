class AddAnalysisDataToRepositories < ActiveRecord::Migration[8.0]
  def change
    add_column :repositories, :analysis_data, :json
  end
end
