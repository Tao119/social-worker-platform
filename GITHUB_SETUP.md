# GitHubセットアップ手順

## 1. GitHubリポジトリの作成

1. GitHubにログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例: `social-worker-platform`）
4. Public または Private を選択
5. 「Create repository」をクリック

## 2. ローカルリポジトリとの接続

作成したリポジトリのURLをコピーして、以下のコマンドを実行：

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# または SSH を使用する場合
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# プッシュ
git push -u origin main
```

## 3. デプロイ

GitHubにプッシュが完了したら、`DEPLOYMENT.md` の手順に従ってRenderとVercelにデプロイしてください。

## 現在の状態

✅ すべての変更がコミット済み
✅ デプロイ設定ファイルが作成済み
✅ ドキュメントが整備済み

次のステップ：

1. GitHubリポジトリを作成
2. リモートリポジトリを追加
3. プッシュ
4. RenderとVercelでデプロイ
