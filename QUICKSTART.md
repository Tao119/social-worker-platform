# クイックスタートガイド

このガイドでは、ソーシャルワーカープラットフォームを最速で起動する手順を説明します。

## 前提条件

- Docker & Docker Compose
- Go 1.21以上
- Node.js 18以上

## 起動手順

### 1. データベースの起動

```bash
docker compose up -d postgres
```

### 2. データベースマイグレーション

```bash
cd backend
make migrate-up
```

### 3. 管理者アカウントの作成

```bash
cd backend
make create-admin
```

プロンプトに従って管理者のメールアドレスとパスワードを入力してください。

### 4. バックエンドの起動

新しいターミナルウィンドウで：

```bash
cd backend
go run cmd/server/main.go
```

または：

```bash
./start-backend.sh
```

バックエンドは http://localhost:8080 で起動します。

### 5. フロントエンドの起動

別のターミナルウィンドウで：

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

### 6. ログイン

1. ブラウザで http://localhost:3000 を開く
2. 作成した管理者アカウントでログイン
3. 管理者ダッシュボードから病院・施設アカウントを作成
4. ログアウトして、作成したアカウントでログインして機能をテスト

## トラブルシューティング

### ポートが使用中

別のプロセスがポートを使用している場合：

```bash
# ポート8080を使用しているプロセスを確認
lsof -i :8080

# ポート3000を使用しているプロセスを確認
lsof -i :3000
```

### データベース接続エラー

```bash
# PostgreSQLコンテナの状態確認
docker compose ps

# ログの確認
docker compose logs postgres

# コンテナの再起動
docker compose restart postgres
```

### マイグレーションエラー

```bash
# マイグレーションをやり直す
cd backend
make migrate-down
make migrate-up
```

## Docker Composeで全て起動（オプション）

全てのサービスをDockerで起動する場合：

```bash
# ビルドと起動
docker compose up --build

# バックグラウンドで起動
docker compose up -d --build
```

注意: 初回起動時は、マイグレーションと管理者アカウント作成を手動で行う必要があります。

## 次のステップ

- 管理者として病院アカウントを作成
- 管理者として施設アカウントを作成
- 病院アカウントでログインして施設を検索
- 施設アカウントでログインして施設情報を登録
- 書類のアップロード・ダウンロード機能をテスト
