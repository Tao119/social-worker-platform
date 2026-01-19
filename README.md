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

詳細なAPI仕様は [API Documentation](./docs/api.md) を参照してください。

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

```bash
# PostgreSQLコンテナの状態確認
docker-compose ps

# ログの確認
docker-compose logs postgres

# コンテナの再起動
docker-compose restart postgres
```

### ポート競合

デフォルトポートが使用中の場合、以下のファイルでポート番号を変更してください：

- Backend: `backend/.env` の `PORT`
- Frontend: `frontend/package.json` の dev スクリプト
- Database: `docker-compose.yml` の ports

### マイグレーションエラー

```bash
# マイグレーションの状態確認
migrate -path backend/migrations -database "postgresql://user:password@localhost:5432/dbname?sslmode=disable" version

# 強制的にバージョンを設定
migrate -path backend/migrations -database "postgresql://user:password@localhost:5432/dbname?sslmode=disable" force <version>
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのissueを作成してください。
