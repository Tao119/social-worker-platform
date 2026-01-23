# Social Worker Platform

ソーシャルワーカー向けのwebアプリケーション - 病院と施設間の患者受け入れプロセスを効率化するプラットフォーム

## 概要

このプラットフォームは、病院と施設間の患者受け入れプロセスを効率化します。病院側は適切な受け入れ施設を検索・閲覧でき、施設側は自施設の情報を登録・管理できます。両者間で書類の送受信が可能で、管理者が全体を統括します。

## 技術スタック

### Frontend

- Next.js 14+ (JavaScript)
- React 18+
- Axios (API通信)
- React Hook Form (フォーム管理)

### Backend

- Go 1.21+
- Gin Web Framework
- JWT認証
- PostgreSQL Driver (lib/pq)

### Database

- PostgreSQL 15+

### Development Tools

- Docker & Docker Compose
- golang-migrate (データベースマイグレーション)

## プロジェクト構造

```
.
├── backend/           # Goバックエンド
│   ├── cmd/          # アプリケーションエントリーポイント
│   ├── config/       # 設定管理
│   ├── handlers/     # HTTPハンドラー
│   ├── middleware/   # ミドルウェア
│   ├── models/       # データモデル
│   └── migrations/   # データベースマイグレーション
├── frontend/         # Next.jsフロントエンド
│   ├── components/   # Reactコンポーネント
│   ├── pages/        # Next.jsページ
│   ├── lib/          # ユーティリティとAPI通信
│   └── styles/       # スタイル
└── docker-compose.yml
```

## セットアップ手順

### 前提条件

- Go 1.21以上
- Node.js 18以上
- Docker & Docker Compose
- PostgreSQL 15以上（ローカル開発の場合）
- golang-migrate CLI

#### golang-migrateのインストール

macOS:

```bash
brew install golang-migrate
```

Linux:

```bash
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

Windows:

```bash
scoop install migrate
```

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd social-worker-platform
```

### 2. データベースのセットアップ

```bash
# Docker Composeでデータベースを起動
docker-compose up -d postgres

# データベースが起動するまで待機
sleep 10

# マイグレーションの実行（本番用データベース）
cd backend
make migrate-up

# テスト用データベースのマイグレーション
DB_NAME=social_worker_platform_test make migrate-up
```

### 3. バックエンドの起動

```bash
cd backend
cp .env.example .env
# .envファイルを編集して環境変数を設定

# 依存関係のインストール
go mod download

# サーバーの起動
go run cmd/main.go
```

バックエンドは http://localhost:8080 で起動します。

### 4. フロントエンドの起動

```bash
cd frontend
cp .env.example .env.local
# .env.localファイルを編集して環境変数を設定

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

## 開発

### バックエンド開発

```bash
cd backend

# テストの実行（データベースが必要）
# 事前にdocker-compose up -d postgresとマイグレーションを実行してください
go test ./...

# プロパティベーステストの実行
go test -v ./... -run Property

# 短時間テストのみ実行（データベース不要）
go test -short ./...

# コードフォーマット
go fmt ./...

# リンター実行
golangci-lint run
```

### フロントエンド開発

```bash
cd frontend

# テストの実行
npm test

# プロパティベーステストの実行
npm test -- --testNamePattern=Property

# コードフォーマット
npm run format

# リンター実行
npm run lint
```

### データベースマイグレーション

```bash
cd backend

# 新しいマイグレーションの作成
migrate create -ext sql -dir migrations -seq <migration_name>

# マイグレーションの適用
make migrate-up

# マイグレーションのロールバック
make migrate-down
```

## API仕様

### Swagger UI（推奨）

バックエンドには Swagger UI が統合されており、インタラクティブなAPIドキュメントを提供しています：

- **ローカル環境**: http://localhost:8080/api/docs
- **本番環境**: https://your-backend.onrender.com/api/docs

Swagger UIでは以下が可能です：

- 全エンドポイントの詳細仕様の閲覧
- リクエスト/レスポンスの例の確認
- ブラウザから直接APIをテスト
- 認証トークンの設定と使用

### OpenAPI仕様ファイル

OpenAPI 3.0.3形式の仕様ファイルは以下から直接アクセスできます：

- http://localhost:8080/api/docs/openapi.yaml
- https://your-backend.onrender.com/api/docs/openapi.yaml

### API.md

詳細なAPI仕様は [API.md](./API.md) も参照してください。

完全なAPIドキュメントには以下が含まれます：

- 全エンドポイントの詳細仕様
- リクエスト/レスポンスの例
- 認証フロー
- エラーハンドリング
- レート制限の詳細

### 主要エンドポイント

- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得
- `GET /api/facilities` - 施設一覧・検索
- `POST /api/facilities` - 施設作成
- `GET /api/documents` - 書類一覧
- `POST /api/documents` - 書類アップロード
- `POST /api/admin/hospitals` - 病院アカウント作成（管理者のみ）
- `POST /api/admin/facilities` - 施設アカウント作成（管理者のみ）

## ユーザーロール

### 病院ユーザー (Hospital User)

- 施設の検索・閲覧
- 書類の送受信
- 自病院情報の管理

### 施設ユーザー (Facility User)

- 施設情報の登録・更新
- 書類の送受信
- 自施設情報の閲覧

### 管理者 (Admin User)

- 病院・施設アカウントの作成・編集・削除
- 全データの閲覧
- システム管理

## トラブルシューティング

### データベース接続エラー

データベースに接続できない場合：

```bash
# PostgreSQLコンテナの状態確認
docker-compose ps

# ログの確認
docker-compose logs postgres

# コンテナの再起動
docker-compose restart postgres

# データベースが起動するまで待機
sleep 10
```

環境変数が正しく設定されているか確認：

```bash
# backend/.envファイルを確認
cat backend/.env

# 必要な変数が設定されているか確認
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

### ポート競合

デフォルトポートが使用中の場合、以下のファイルでポート番号を変更してください：

- Backend: `backend/.env` の `PORT` (デフォルト: 8080)
- Frontend: `frontend/.env.local` の `NEXT_PUBLIC_API_URL` (デフォルト: http://localhost:8080)
- Database: `docker-compose.yml` の ports (デフォルト: 5432)

使用中のポートを確認：

```bash
# macOS/Linux
lsof -i :8080
lsof -i :3000
lsof -i :5432

# プロセスを終了
kill -9 <PID>
```

### マイグレーションエラー

マイグレーションが失敗する場合：

```bash
# マイグレーションの状態確認
cd backend
migrate -path migrations -database "postgresql://user:password@localhost:5432/social_worker_platform?sslmode=disable" version

# 強制的にバージョンを設定（慎重に使用）
migrate -path migrations -database "postgresql://user:password@localhost:5432/social_worker_platform?sslmode=disable" force <version>

# データベースをリセットして再マイグレーション
make migrate-down
make migrate-up
```

### JWT認証エラー

JWT_SECRETが設定されていない場合、認証が失敗します：

```bash
# backend/.envファイルにJWT_SECRETを追加
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env

# サーバーを再起動
```

### ファイルアップロードエラー

ファイルアップロードが失敗する場合：

```bash
# アップロードディレクトリの作成と権限設定
mkdir -p backend/uploads
chmod 755 backend/uploads

# backend/.envでUPLOAD_DIRが正しく設定されているか確認
cat backend/.env | grep UPLOAD_DIR
```

### フロントエンドのビルドエラー

依存関係のインストールに失敗する場合：

```bash
cd frontend

# node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 再インストール
npm install

# キャッシュをクリア
npm cache clean --force
npm install
```

### CORS エラー

フロントエンドからAPIにアクセスできない場合：

```bash
# backend/.envでCORS_ORIGINSが正しく設定されているか確認
cat backend/.env | grep CORS_ORIGINS

# フロントエンドのURLを追加（カンマ区切り）
# CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### テスト実行エラー

テストが失敗する場合：

```bash
# テスト用データベースの作成とマイグレーション
docker-compose up -d postgres
sleep 10

cd backend
DB_NAME=social_worker_platform_test make migrate-up

# JWT_SECRETを設定してテスト実行
JWT_SECRET=test-secret go test ./...

# 短時間テストのみ実行（データベース不要）
go test -short ./...
```

### 管理者アカウントの作成に失敗

管理者アカウントの作成に失敗する場合：

```bash
# データベースが起動しているか確認
docker-compose ps

# マイグレーションが完了しているか確認
cd backend
make migrate-up

# 管理者作成コマンドを再実行
make create-admin
```

### 環境変数の確認

すべての必要な環境変数が設定されているか確認：

```bash
# バックエンド
cd backend
cat .env

# 必須変数:
# - DB_HOST
# - DB_PORT
# - DB_USER
# - DB_PASSWORD
# - DB_NAME
# - JWT_SECRET
# - PORT
# - CORS_ORIGINS
# - UPLOAD_DIR

# フロントエンド
cd frontend
cat .env.local

# 必須変数:
# - NEXT_PUBLIC_API_URL
```

詳細な環境変数の説明は [ENVIRONMENT.md](./ENVIRONMENT.md) を参照してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのissueを作成してください。

## Project Status

### Completed Implementation ✅

Both backend and frontend have been fully implemented with the following features:

#### Backend Features

- **Authentication System**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Three user roles (hospital, facility, admin) with proper authorization
- **Database Layer**: Complete CRUD operations for all entities with PostgreSQL
- **Middleware Stack**: CORS, logging, error handling, authentication, and authorization
- **API Endpoints**:
  - Authentication (login, logout, current user)
  - Facility management (create, list, search, update, view own)
  - Document management (upload, list, download with access control)
  - Admin functions (hospital and facility account management)

#### Frontend Features

- **Authentication UI**: Login page with JWT token management
- **Hospital User Interface**:
  - Facility search with filters (name, bed capacity, location)
  - Facility detail view
  - Document management
- **Facility User Interface**:
  - Facility information registration and editing
  - Document management
- **Admin Interface**:
  - Hospital account management (CRUD)
  - Facility account management (CRUD)
- **Responsive Design**: Tailwind CSS for modern, responsive UI

#### Testing & Quality Assurance

- **Unit Tests**: Comprehensive test coverage for all handlers and middleware
- **Property-Based Tests**: 100+ iterations per property using gopter library
- **Correctness Properties**: 35 properties validated including:
  - Password encryption and JWT token security
  - Role-based access control
  - Data persistence and round-trip validation
  - Referential integrity with cascade deletes
  - Session expiration handling

#### Database Schema

- Users table with role-based authentication
- Hospitals and facilities with user relationships
- Documents with sender/recipient tracking
- Proper indexes and CASCADE delete constraints

### Next Steps

- Integration testing
- Deployment configuration
- Docker configuration for frontend

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Go 1.21+
- Node.js 18+
- PostgreSQL client (for migrations)

### Starting the Application

1. **Start PostgreSQL with Docker:**

```bash
docker compose up -d
```

2. **Run database migrations:**

```bash
cd backend
make migrate-up
```

3. **Create an admin user:**

```bash
cd backend
make create-admin
# Follow the prompts to create an admin account
```

4. **Start the backend server:**

```bash
cd backend
go run cmd/server/main.go
```

Or use the convenience script:

```bash
./start-backend.sh
```

The API will be available at `http://localhost:8080`

5. **Start the frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### First Login

1. Open your browser and navigate to `http://localhost:3000`
2. Log in with the admin account you created
3. Create hospital and facility accounts from the admin dashboard
4. Log out and test with different user roles

### API Endpoints

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Facilities (Hospital users)

- `GET /api/facilities` - List/search facilities
- `GET /api/facilities/:id` - Get facility details

#### Facilities (Facility users)

- `POST /api/facilities` - Create facility
- `PUT /api/facilities/:id` - Update facility
- `GET /api/facilities/me` - Get own facility

#### Documents

- `POST /api/documents` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document

#### Admin

- `POST /api/admin/hospitals` - Create hospital account
- `GET /api/admin/hospitals` - List hospitals
- `PUT /api/admin/hospitals/:id` - Update hospital
- `DELETE /api/admin/hospitals/:id` - Delete hospital
- `POST /api/admin/facilities` - Create facility account
- `GET /api/admin/facilities` - List facilities
- `PUT /api/admin/facilities/:id` - Update facility
- `DELETE /api/admin/facilities/:id` - Delete facility

### Testing the Application

You can test the application by:

1. **Using the Web UI**: Navigate to `http://localhost:3000` and use the interface
2. **Using the API directly**: Test endpoints using curl or Postman

Example API call:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

## Development Status

- ✅ Backend API: Complete
- ✅ Frontend UI: Complete
- ✅ Database: Complete with migrations
- ✅ Authentication: Complete with JWT
- ✅ Testing: Comprehensive unit and property tests
- ⏳ Integration Testing: Pending
- ⏳ Deployment: Pending
