# Engineer Connect - ソフトウェアエンジニア交流サービス

## 概要
Engineer ConnectはソフトウェアエンジニアのためのAI駆動型自己紹介・交流サービスです。GitHub OAuthを通じてユーザーのリポジトリ情報を取得し、AIがそれを解析してチャット形式で他のユーザーにプロフィールを説明します。

## コンセプト
現在、ソフトウェアエンジニアの主要な交流ハブはGitHubです。このプラットフォームでは：
- GitHubアカウント間の交流をより簡単で活発にする
- GitHub OAuthで連携し、リポジトリ情報をAIに解析させる  
- AIがチャット形式で他ユーザーにエンジニアのスキル・経験を説明
- gitMCP技術を活用してリアルタイムでの最新コード状況を把握

## 技術スタック

### Backend (Rails API)
- **Rails 8.0.2** - APIモード
- **PostgreSQL** - メインデータベース
- **JWT** - 認証トークン管理
- **Octokit** - GitHub API連携
- **CORS** - フロントエンドとの通信

### Frontend (Next.js)
- **Next.js 15** - React フレームワーク (App Router)
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Axios** - API通信
- **React Hooks** - 状態管理

### 外部サービス連携
- **GitHub OAuth** - 認証・リポジトリアクセス
- **GitHub API** - ユーザー・リポジトリ情報取得
- **gitMCP** - GitHub リポジトリのAIアクセス対応

## アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   GitHub API    │
│   (Next.js)     │◄──►│   (Rails API)    │◄──►│                 │
│   Port: 3000    │    │   Port: 3001     │    │   OAuth & Data  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 実装フェーズ

### ✅ Phase 1: 基本認証・GitHub連携 (完了)
- GitHub OAuth認証システム
- JWT トークンベース認証
- ユーザー情報の取得・保存
- フロントエンド認証フロー

### ✅ Phase 2: GitHubデータ取得・保存機能 (完了)
- Repository モデルによるリポジトリ情報管理
- GitHub API経由でのリポジトリデータ取得
- README・コミット履歴の自動取得
- フィルタリング・ソート機能付きダッシュボード

### 🚧 Phase 3: AI統合とプロフィール解析 (次回実装予定)
- OpenAI/Claude API統合
- GitHubデータのAI解析
- エンジニアプロフィールの自動生成
- gitMCP統合によるリアルタイムコード解析

### 📋 Phase 4: チャット機能とマッチング (今後予定)
- リアルタイムチャット機能
- AI駆動のエンジニアマッチング
- スキルベースの推薦システム

### 📋 Phase 5: gitMCP統合とリアルタイム解析 (今後予定)
- gitMCP サーバー統合
- リアルタイムコード品質分析
- 技術スタック深掘り解析

## 環境設定

### 必要な環境変数

#### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 起動方法

#### Backend
```bash
cd backend
bundle install
rails db:create db:migrate
rails server
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API エンドポイント

### 認証
- `POST /auth/github` - GitHub OAuth コールバック
- `GET /auth/me` - 現在ユーザー情報取得

### リポジトリ
- `GET /repositories` - ユーザーのリポジトリ一覧取得
- `GET /repositories/:id` - 特定リポジトリの詳細取得
- `POST /repositories/sync` - GitHub からリポジトリ情報同期

## 主要機能

### 現在利用可能
1. **GitHub OAuth認証** - 安全なログイン機能
2. **リポジトリ同期** - GitHub からの自動データ取得
3. **インテリジェントダッシュボード** - フィルタリング・ソート機能
4. **リポジトリ詳細表示** - README、コミット情報を含む詳細表示

### 開発中・予定
1. **AI プロフィール解析** - GitHub データの AI 解析
2. **チャットボット機能** - エンジニア紹介の自動化
3. **gitMCP 統合** - リアルタイムコード解析
4. **マッチングシステム** - スキルベースのエンジニア推薦

## ライセンス
このプロジェクトはデモ用途のため、商用利用は想定していません。

## 開発状況
このアプリケーションはハッカソン用のデモアプリケーションとして開発されています。セキュリティ面（JWT の localStorage 保存など）はプロダクション環境では適切に対処する必要があります。
