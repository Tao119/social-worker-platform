# Vercel デプロイ設定

## Vercelでのプロジェクト設定

### 1. プロジェクトのインポート

1. Vercelダッシュボードで「Add New...」→「Project」を選択
2. GitHubリポジトリ `social-worker-platform` を選択

### 2. プロジェクト設定

以下の設定を入力してください：

#### Framework Preset

- **Framework**: Next.js

#### Root Directory

- **Root Directory**: `frontend`
  - 「Edit」をクリックして `frontend` と入力

#### Build and Output Settings

- **Build Command**: `npm run build` (デフォルトのまま)
- **Output Directory**: `.next` (デフォルトのまま)
- **Install Command**: `npm install` (デフォルトのまま)

#### Environment Variables

以下の環境変数を追加：

| Name                  | Value                                   |
| --------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.onrender.com` |

**注意**: バックエンドのURLは、Renderでデプロイ後に取得できます。

### 3. デプロイ

「Deploy」ボタンをクリックしてデプロイを開始します。

### 4. デプロイ後の設定

デプロイが完了したら：

1. VercelのプロジェクトURLをコピー（例: `https://social-worker-platform.vercel.app`）
2. Renderのバックエンド環境変数を更新：
   - `CORS_ALLOWED_ORIGINS` = `https://social-worker-platform.vercel.app`
3. Renderでバックエンドを再デプロイ

## トラブルシューティング

### ビルドエラーが発生する場合

1. **Root Directoryが正しく設定されているか確認**
   - `frontend` ディレクトリを指定する必要があります

2. **環境変数が設定されているか確認**
   - `NEXT_PUBLIC_API_URL` が設定されているか確認

3. **Node.jsバージョンの確認**
   - Vercelは自動的に適切なNode.jsバージョンを選択します
   - 必要に応じて `package.json` に `engines` フィールドを追加

### デプロイは成功するがページが表示されない場合

1. **ブラウザのコンソールでエラーを確認**
2. **API URLが正しいか確認**
3. **CORSエラーの場合**
   - Renderのバックエンドで `CORS_ALLOWED_ORIGINS` が正しく設定されているか確認

## 確認事項

- [x] GitHubリポジトリがプッシュ済み
- [ ] Vercelプロジェクトを作成
- [ ] Root Directoryを `frontend` に設定
- [ ] 環境変数 `NEXT_PUBLIC_API_URL` を設定
- [ ] デプロイ成功
- [ ] RenderのCORS設定を更新
- [ ] フロントエンドにアクセス可能
- [ ] ログイン機能が動作
