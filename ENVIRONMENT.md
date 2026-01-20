# 環境変数設定ガイド

このドキュメントでは、ソーシャルワーカープラットフォームで使用する環境変数について説明します。

## バックエンド環境変数

バックエンドの環境変数は `backend/.env` ファイルで設定します。

### サーバー設定

| 変数名     | 説明                                                                                                    | デフォルト値 | 必須   |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| `PORT`     | サーバーが待ち受けるポート番号                                                                          | `8080`       | いいえ |
| `GIN_MODE` | Ginフレームワークの動作モード<br>- `debug`: 開発環境用（詳細ログ）<br>- `release`: 本番環境用（最適化） | `debug`      | いいえ |

### データベース設定

| 変数名        | 説明                                                                                         | デフォルト値             | 必須   |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------ | ------ |
| `DB_HOST`     | PostgreSQLサーバーのホスト名またはIPアドレス                                                 | `localhost`              | はい   |
| `DB_PORT`     | PostgreSQLサーバーのポート番号                                                               | `5432`                   | はい   |
| `DB_USER`     | データベース接続ユーザー名                                                                   | `postgres`               | はい   |
| `DB_PASSWORD` | データベース接続パスワード                                                                   | `postgres`               | はい   |
| `DB_NAME`     | 使用するデータベース名                                                                       | `social_worker_platform` | はい   |
| `DB_SSLMODE`  | SSL接続モード<br>- `disable`: SSL無効<br>- `require`: SSL必須<br>- `verify-full`: 証明書検証 | `disable`                | いいえ |

### JWT認証設定

| 変数名                 | 説明                                                                           | デフォルト値                                | 必須   |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- | ------ |
| `JWT_SECRET`           | JWTトークン署名用のシークレットキー<br>**⚠️ 本番環境では必ず変更してください** | `your-secret-key-change-this-in-production` | はい   |
| `JWT_EXPIRATION_HOURS` | JWTトークンの有効期限（時間単位）                                              | `24`                                        | いいえ |

**セキュリティ上の注意**:

- `JWT_SECRET`は十分に長く、ランダムな文字列を使用してください（最低32文字推奨）
- 本番環境では絶対にデフォルト値を使用しないでください
- シークレットキーは環境変数または安全なシークレット管理サービスで管理してください

### CORS設定

| 変数名                 | 説明                                                 | デフォルト値            | 必須 |
| ---------------------- | ---------------------------------------------------- | ----------------------- | ---- |
| `CORS_ALLOWED_ORIGINS` | CORSで許可するオリジン（カンマ区切りで複数指定可能） | `http://localhost:3000` | はい |

**例**:

```bash
# 単一オリジン
CORS_ALLOWED_ORIGINS=http://localhost:3000

# 複数オリジン
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://example.com,https://app.example.com
```

### ファイルアップロード設定

| 変数名               | 説明                                         | デフォルト値 | 必須   |
| -------------------- | -------------------------------------------- | ------------ | ------ |
| `UPLOAD_DIR`         | アップロードされたファイルの保存ディレクトリ | `./uploads`  | いいえ |
| `MAX_UPLOAD_SIZE_MB` | 最大アップロードファイルサイズ（MB単位）     | `10`         | いいえ |

## フロントエンド環境変数

フロントエンドの環境変数は `frontend/.env.local` ファイルで設定します。

### API設定

| 変数名                | 説明                       | デフォルト値            | 必須 |
| --------------------- | -------------------------- | ----------------------- | ---- |
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのベースURL | `http://localhost:8080` | はい |

**重要な注意事項**:

- `NEXT_PUBLIC_`プレフィックスが付いた環境変数は、**ビルド時にクライアント側のコードに埋め込まれます**
- 環境変数を変更した場合は、フロントエンドを再ビルドする必要があります
- 本番環境では適切なAPIのURLを設定してください

## 環境別の設定例

### 開発環境

**backend/.env**:

```bash
PORT=8080
GIN_MODE=debug
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=social_worker_platform
DB_SSLMODE=disable
JWT_SECRET=development-secret-key-do-not-use-in-production
JWT_EXPIRATION_HOURS=24
CORS_ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
```

**frontend/.env.local**:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 本番環境

**backend/.env**:

```bash
PORT=8080
GIN_MODE=release
DB_HOST=production-db.example.com
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=<strong-random-password>
DB_NAME=social_worker_platform
DB_SSLMODE=require
JWT_SECRET=<strong-random-secret-minimum-32-characters>
JWT_EXPIRATION_HOURS=24
CORS_ALLOWED_ORIGINS=https://app.example.com
UPLOAD_DIR=/var/app/uploads
MAX_UPLOAD_SIZE_MB=10
```

**frontend/.env.local** (ビルド時):

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

## テスト環境

テスト実行時は、以下の環境変数が必要です：

```bash
export JWT_SECRET=test-secret-key
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=social_worker_platform_test
```

または、テスト用の`.env.test`ファイルを作成することもできます。

## セキュリティベストプラクティス

1. **シークレットキーの管理**
   - 本番環境のシークレットキーはコードリポジトリにコミットしない
   - 環境変数または専用のシークレット管理サービス（AWS Secrets Manager、HashiCorp Vaultなど）を使用

2. **データベース認証情報**
   - 強力なパスワードを使用
   - 最小権限の原則に従ってデータベースユーザーを作成
   - 本番環境では専用のデータベースユーザーを使用

3. **CORS設定**
   - 本番環境では信頼できるオリジンのみを許可
   - ワイルドカード（`*`）は使用しない

4. **SSL/TLS**
   - 本番環境では必ずSSL/TLSを有効化
   - データベース接続も暗号化（`DB_SSLMODE=require`）

## トラブルシューティング

### データベース接続エラー

```
Error: failed to connect to database
```

**解決方法**:

1. データベースが起動していることを確認
2. `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`が正しいことを確認
3. ファイアウォールでポートが開いていることを確認

### JWT認証エラー

```
Error: JWT_SECRET environment variable is not set
```

**解決方法**:

1. `.env`ファイルに`JWT_SECRET`が設定されていることを確認
2. サーバーを再起動

### CORS エラー

```
Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決方法**:

1. `CORS_ALLOWED_ORIGINS`にフロントエンドのURLが含まれていることを確認
2. バックエンドサーバーを再起動
