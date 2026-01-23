# デプロイガイド

このアプリケーションをRender（バックエンド）とVercel（フロントエンド）にデプロイする手順です。

## 前提条件

- GitHubアカウント
- Renderアカウント
- Vercelアカウント

## 1. GitHubへのプッシュ

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 2. Renderでバックエンドをデプロイ

### データベースの作成

1. Renderダッシュボードで「New +」→「PostgreSQL」を選択
2. 以下の設定を入力：
   - Name: `social-worker-db`
   - Database: `social_worker_platform`
   - User: `postgres`
   - Region: Oregon (US West)
   - Plan: Free
3. 「Create Database」をクリック

### バックエンドサービスの作成

1. Renderダッシュボードで「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 以下の設定を入力：
   - Name: `social-worker-backend`
   - Region: Oregon (US West)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Go
   - Build Command: `go build -o bin/server cmd/server/main.go`
   - Start Command: `./bin/server`
   - Plan: Free

4. 環境変数を設定：
   - `PORT`: `8080`
   - `GIN_MODE`: `release`
   - `DB_HOST`: データベースの Internal Database URL のホスト部分
   - `DB_PORT`: `5432`
   - `DB_USER`: データベースのユーザー名
   - `DB_PASSWORD`: データベースのパスワード
   - `DB_NAME`: `social_worker_platform`
   - `DB_SSLMODE`: `require`
   - `JWT_SECRET`: ランダムな文字列（32文字以上推奨）
   - `CORS_ALLOWED_ORIGINS`: Vercelのフロントエンドドメイン（後で設定）
   - `UPLOAD_DIR`: `/opt/render/project/src/uploads`

5. 「Create Web Service」をクリック

### マイグレーションの実行

デプロイ後、Renderのシェルから以下を実行：

```bash
cd backend
# マイグレーションツールをインストール
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# マイグレーションを実行
migrate -path migrations -database "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" up
```

または、psqlで直接実行：

```bash
psql $DATABASE_URL -f migrations/000001_create_users_table.up.sql
psql $DATABASE_URL -f migrations/000002_create_hospitals_table.up.sql
# ... 他のマイグレーションファイルも順番に実行
```

### 管理者ユーザーの作成

```bash
cd backend
go run cmd/create-admin/main.go
```

## 3. Vercelでフロントエンドをデプロイ

1. Vercelダッシュボードで「Add New...」→「Project」を選択
2. GitHubリポジトリをインポート
3. 以下の設定を入力：
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. 環境変数を設定：
   - `NEXT_PUBLIC_API_URL`: RenderのバックエンドURL（例: `https://social-worker-backend.onrender.com`）

5. 「Deploy」をクリック

## 4. CORS設定の更新

フロントエンドのデプロイが完了したら：

1. VercelのドメインをコピーしてRenderのバックエンド環境変数を更新：
   - `CORS_ALLOWED_ORIGINS`: `https://your-app.vercel.app`

2. Renderでサービスを再デプロイ

## 5. 動作確認

1. Vercelのフロントエンドにアクセス
2. 管理者アカウントでログイン
3. 病院と施設のアカウントを作成
4. 各機能をテスト

## 6. APIドキュメント

バックエンドには Swagger UI が統合されています。以下のURLでAPIドキュメントを確認できます：

- ローカル環境: http://localhost:8080/api/docs
- 本番環境: https://your-backend.onrender.com/api/docs

OpenAPI仕様ファイルは以下から直接アクセスできます：

- http://localhost:8080/api/docs/openapi.yaml
- https://your-backend.onrender.com/api/docs/openapi.yaml

## トラブルシューティング

### データベース接続エラー

- `DB_SSLMODE=require` が設定されているか確認
- データベースのInternal Database URLを使用しているか確認

### CORS エラー

- `CORS_ALLOWED_ORIGINS` にVercelのドメインが正しく設定されているか確認
- プロトコル（https://）が含まれているか確認

### ファイルアップロードエラー

- `UPLOAD_DIR` が書き込み可能なディレクトリか確認
- Renderの永続ストレージを使用する場合は、Disk設定を追加

## 本番環境の推奨設定

### セキュリティ

- JWT_SECRETは強力なランダム文字列を使用
- データベースパスワードは複雑なものを使用
- HTTPS通信を強制

### パフォーマンス

- Renderの有料プランでスリープを防止
- データベースのコネクションプールを最適化
- 静的ファイルのCDN配信を検討

### モニタリング

- Renderのログを定期的に確認
- エラー通知を設定
- データベースのバックアップを有効化
