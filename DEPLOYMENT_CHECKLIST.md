# デプロイチェックリスト

## ✅ 完了済み

### コード

- [x] 全機能の実装完了
- [x] UIの日本語化
- [x] リクエスト番号の表示を削除
- [x] エラーハンドリングの実装

### デプロイ設定

- [x] `render.yaml` - Renderデプロイ設定
- [x] `frontend/vercel.json` - Vercelデプロイ設定
- [x] `backend/Dockerfile` - バックエンドDockerfile
- [x] `frontend/Dockerfile` - フロントエンドDockerfile
- [x] `.env.example` ファイルの更新（本番環境用）

### ドキュメント

- [x] `DEPLOYMENT.md` - デプロイ手順書
- [x] `GITHUB_SETUP.md` - GitHubセットアップ手順
- [x] `README.md` - プロジェクト概要

### データベース

- [x] マイグレーションファイル（10個）
- [x] 管理者作成スクリプト

## 📋 手動で行う作業

### 1. GitHubへのプッシュ

```bash
# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Renderでのデプロイ

1. PostgreSQLデータベースを作成
2. Web Serviceを作成（バックエンド）
3. 環境変数を設定
4. マイグレーションを実行
5. 管理者ユーザーを作成

### 3. Vercelでのデプロイ

1. プロジェクトをインポート
2. 環境変数を設定（`NEXT_PUBLIC_API_URL`）
3. デプロイ

### 4. CORS設定の更新

1. VercelのURLをコピー
2. RenderのバックエンドでCORS_ALLOWED_ORIGINSを更新
3. 再デプロイ

## 🔑 必要な環境変数

### バックエンド（Render）

- `PORT`: 8080
- `GIN_MODE`: release
- `DB_HOST`: データベースホスト
- `DB_PORT`: 5432
- `DB_USER`: データベースユーザー
- `DB_PASSWORD`: データベースパスワード
- `DB_NAME`: social_worker_platform
- `DB_SSLMODE`: require
- `JWT_SECRET`: ランダムな文字列（32文字以上）
- `CORS_ALLOWED_ORIGINS`: Vercelのフロントエンドドメイン
- `UPLOAD_DIR`: /opt/render/project/src/uploads

### フロントエンド（Vercel）

- `NEXT_PUBLIC_API_URL`: RenderのバックエンドURL

## 📊 実装済み機能

### 認証・認可

- ログイン/ログアウト
- JWT認証
- ロールベースアクセス制御（admin, hospital, facility）

### 管理者機能

- 病院アカウント管理（作成、編集、削除）
- 施設アカウント管理（作成、編集、削除）

### 病院機能

- 施設検索・閲覧
- 受け入れリクエスト作成・編集・キャンセル
- メッセージルームでのコミュニケーション
- ファイル共有
- 作業完了マーク

### 施設機能

- プロフィール管理
- 受け入れリクエスト閲覧
- リクエストの承認・拒否
- メッセージルームでのコミュニケーション
- ファイル共有
- 作業完了マーク

### メッセージルーム

- リアルタイムメッセージング（5秒ポーリング）
- ファイルアップロード・ダウンロード・削除
- ステータス管理（検討中、承認済み、完了、拒否）
- 完了後も連絡可能

### 書類管理

- フォルダ分け機能
- アップロード・ダウンロード・削除
- 送信者のみ削除可能

## 🚀 デプロイ後の確認事項

1. [ ] フロントエンドにアクセス可能
2. [ ] 管理者でログイン可能
3. [ ] 病院アカウントを作成可能
4. [ ] 施設アカウントを作成可能
5. [ ] 病院でログインして施設を検索可能
6. [ ] リクエストを作成可能
7. [ ] 施設でリクエストを承認可能
8. [ ] メッセージルームでチャット可能
9. [ ] ファイルのアップロード・ダウンロード可能
10. [ ] 作業完了フローが正常に動作

## 📝 注意事項

- Renderの無料プランは30分間アクセスがないとスリープします
- 初回アクセス時は起動に時間がかかる場合があります
- ファイルアップロードはRenderの一時ストレージに保存されます
- 本番環境では永続ストレージの設定を推奨します
