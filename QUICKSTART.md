# クイックスタートガイド

このガイドでは、Social Worker Platformを最速で起動して動作確認する手順を説明します。

## 前提条件

以下がインストールされていることを確認してください：

- Docker & Docker Compose
- Go 1.21以上
- Node.js 18以上
- golang-migrate CLI

## 5分でスタート

### 1. データベースの起動

```bash
# PostgreSQLコンテナを起動
docker-compose up -d postgres

# データベースが起動するまで待機
sleep 10
```

### 2. データベースのマイグレーション

```bash
cd backend

# マイグレーションを実行
migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/social_worker_platform?sslmode=disable" up

# テスト用データベースのマイグレーション
migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/social_worker_platform_test?sslmode=disable" up
```

### 3. 環境変数の設定

```bash
# バックエンドの環境変数
cd backend
cp .env.example .env

# フロントエンドの環境変数
cd ../frontend
cp .env.example .env.local
```

デフォルト設定で動作しますが、JWT_SECRETは変更することを推奨します：

```bash
# backend/.envを編集
JWT_SECRET=$(openssl rand -base64 32)
```

### 4. 管理者アカウントの作成

```bash
cd backend
go run cmd/create-admin/main.go

# プロンプトに従って入力：
# Email: admin@example.com
# Password: (任意の安全なパスワード)
# Name: Admin User
```

### 5. バックエンドの起動

```bash
cd backend
go run cmd/server/main.go
```

または便利スクリプトを使用：

```bash
./start-backend.sh
```

バックエンドは http://localhost:8080 で起動します。

### 6. フロントエンドの起動

新しいターミナルを開いて：

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

## 動作確認

### 1. ログイン

1. ブラウザで http://localhost:3000 を開く
2. 作成した管理者アカウントでログイン

### 2. 病院アカウントの作成

1. 管理者ダッシュボードから「病院アカウント管理」を選択
2. 「新規病院アカウント作成」をクリック
3. 以下の情報を入力：
   - メールアドレス: hospital@example.com
   - パスワード: hospital123
   - 病院名: テスト病院
4. 「作成」をクリック

### 3. 施設アカウントの作成

1. 管理者ダッシュボードから「施設アカウント管理」を選択
2. 「新規施設アカウント作成」をクリック
3. 以下の情報を入力：
   - メールアドレス: facility@example.com
   - パスワード: facility123
   - 施設名: テスト施設
4. 「作成」をクリック

### 4. 施設情報の登録

1. ログアウトして、施設アカウントでログイン
2. 「施設情報」メニューを選択
3. 施設の詳細情報を入力：
   - 施設名: テスト施設
   - 住所: 東京都渋谷区
   - 電話番号: 03-1234-5678
   - 病床数: 50
   - 受け入れ条件: 要介護1-5
4. 「保存」をクリック

### 5. 施設の検索

1. ログアウトして、病院アカウントでログイン
2. 「施設検索」メニューを選択
3. 検索条件を入力（例：病床数30以上）
4. 登録した施設が表示されることを確認
5. 施設をクリックして詳細情報を確認

### 6. 書類の送信

1. 病院アカウントでログイン
2. 「書類管理」メニューを選択
3. 「書類をアップロード」をクリック
4. ファイルを選択し、送信先施設を選択
5. 「送信」をクリック

### 7. 書類の受信確認

1. ログアウトして、施設アカウントでログイン
2. 「書類管理」メニューを選択
3. 受信した書類が表示されることを確認
4. 書類をクリックしてダウンロード

## APIのテスト

curlを使用してAPIを直接テストすることもできます：

```bash
# ログイン
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# レスポンスからtokenを取得

# 現在のユーザー情報を取得
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 施設一覧を取得
curl -X GET http://localhost:8080/api/facilities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 次のステップ

- [API.md](./API.md) - 完全なAPI仕様
- [ENVIRONMENT.md](./ENVIRONMENT.md) - 環境変数の詳細
- [README.md](./README.md) - 詳細なドキュメント

## トラブルシューティング

問題が発生した場合は、[README.md](./README.md) のトラブルシューティングセクションを参照してください。

よくある問題：

- **データベース接続エラー**: `docker-compose ps` でPostgreSQLが起動しているか確認
- **ポート競合**: 8080または3000ポートが使用中でないか確認
- **JWT認証エラー**: backend/.envにJWT_SECRETが設定されているか確認
- **CORS エラー**: backend/.envのCORS_ORIGINSにフロントエンドのURLが含まれているか確認

## 開発モードでの起動

すべてのサービスをDockerで起動する場合：

```bash
# すべてのサービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# 停止
docker-compose down
```

注意: フロントエンドのDockerイメージは本番用にビルドされています。開発時はローカルで `npm run dev` を実行することを推奨します。
