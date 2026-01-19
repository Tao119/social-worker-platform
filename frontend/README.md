# ソーシャルワーカープラットフォーム - フロントエンド

Next.js 14を使用したソーシャルワーカープラットフォームのフロントエンドアプリケーションです。

## 技術スタック

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Axios

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成します：

```bash
cp .env.example .env.local
```

`.env.local`を編集してバックエンドAPIのURLを設定します：

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 機能

### 認証

- ログイン/ログアウト
- JWT認証
- ロールベースアクセス制御

### 病院ユーザー

- 施設検索（フィルター機能付き）
- 施設詳細表示
- 書類管理

### 施設ユーザー

- 施設情報登録・編集
- 書類管理

### 管理者

- 病院アカウント管理（CRUD）
- 施設アカウント管理（CRUD）

## ディレクトリ構造

```
frontend/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者ページ
│   ├── dashboard/         # ダッシュボード
│   ├── documents/         # 書類管理
│   ├── facilities/        # 施設検索・詳細
│   ├── facility/          # 施設ユーザー用ページ
│   ├── login/             # ログインページ
│   ├── layout.js          # ルートレイアウト
│   └── page.js            # ホームページ
├── lib/                   # ユーティリティ
│   ├── api.js            # API通信
│   └── AuthContext.js    # 認証コンテキスト
└── public/               # 静的ファイル
```

## ビルド

本番用ビルド：

```bash
npm run build
```

本番サーバーの起動：

```bash
npm start
```
