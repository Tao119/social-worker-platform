# API仕様書

ソーシャルワーカープラットフォーム REST API v1.0

## ベースURL

```
http://localhost:8080
```

本番環境では適切なドメインに置き換えてください。

## 認証

このAPIはJWT（JSON Web Token）ベースの認証を使用します。

### 認証フロー

1. `/api/auth/login`エンドポイントでログイン
2. レスポンスで受け取ったJWTトークンを保存
3. 以降のリクエストで`Authorization`ヘッダーにトークンを含める

```
Authorization: Bearer <your-jwt-token>
```

### トークンの有効期限

- デフォルト: 24時間
- 期限切れ後は再ログインが必要

## エラーレスポンス

すべてのエラーレスポンスは以下の形式で返されます：

```json
{
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード

| コード | 説明                   |
| ------ | ---------------------- |
| 200    | 成功                   |
| 201    | 作成成功               |
| 400    | 不正なリクエスト       |
| 401    | 認証エラー             |
| 403    | 権限エラー             |
| 404    | リソースが見つからない |
| 429    | レート制限超過         |
| 500    | サーバーエラー         |

---

## 認証エンドポイント

### ログイン

ユーザー認証を行い、JWTトークンを取得します。

**エンドポイント**: `POST /api/auth/login`

**認証**: 不要

**リクエストボディ**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス** (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "hospital",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**エラーレスポンス**:

- 401: 認証情報が無効
- 400: リクエストボディが不正

---

### ログアウト

現在のセッションを終了します。

**エンドポイント**: `POST /api/auth/logout`

**認証**: 必要

**レスポンス** (200 OK):

```json
{
  "message": "Logged out successfully"
}
```

---

### 現在のユーザー情報取得

ログイン中のユーザー情報を取得します。

**エンドポイント**: `GET /api/auth/me`

**認証**: 必要

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "hospital",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 施設エンドポイント

### 施設作成

新しい施設を登録します。

**エンドポイント**: `POST /api/facilities`

**認証**: 必要（施設ユーザーのみ）

**リクエストボディ**:

```json
{
  "name": "サンプル施設",
  "address": "東京都渋谷区1-2-3",
  "phone": "03-1234-5678",
  "bed_capacity": 50,
  "acceptance_conditions": "24時間対応可能、医療ケア対応"
}
```

**レスポンス** (201 Created):

```json
{
  "id": 1,
  "user_id": 2,
  "name": "サンプル施設",
  "address": "東京都渋谷区1-2-3",
  "phone": "03-1234-5678",
  "bed_capacity": 50,
  "acceptance_conditions": "24時間対応可能、医療ケア対応",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 400: 必須フィールドが不足、またはバリデーションエラー
- 403: 施設ユーザー以外がアクセス

---

### 施設一覧・検索

施設を検索します。

**エンドポイント**: `GET /api/facilities`

**認証**: 必要（病院ユーザーのみ）

**クエリパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `name` | string | 施設名で部分一致検索 |
| `address` | string | 住所で部分一致検索 |
| `min_bed_capacity` | integer | 最小病床数でフィルタ |

**リクエスト例**:

```
GET /api/facilities?name=サンプル&min_bed_capacity=30
```

**レスポンス** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 2,
    "name": "サンプル施設",
    "address": "東京都渋谷区1-2-3",
    "phone": "03-1234-5678",
    "bed_capacity": 50,
    "acceptance_conditions": "24時間対応可能、医療ケア対応",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**エラーレスポンス**:

- 403: 病院ユーザー以外がアクセス

---

### 施設詳細取得

特定の施設の詳細情報を取得します。

**エンドポイント**: `GET /api/facilities/:id`

**認証**: 必要（病院ユーザーのみ）

**パスパラメータ**:

- `id`: 施設ID

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "user_id": 2,
  "name": "サンプル施設",
  "address": "東京都渋谷区1-2-3",
  "phone": "03-1234-5678",
  "bed_capacity": 50,
  "acceptance_conditions": "24時間対応可能、医療ケア対応",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 404: 施設が見つからない
- 403: 病院ユーザー以外がアクセス

---

### 施設情報更新

自施設の情報を更新します。

**エンドポイント**: `PUT /api/facilities/:id`

**認証**: 必要（施設ユーザー、自施設のみ）

**パスパラメータ**:

- `id`: 施設ID

**リクエストボディ**:

```json
{
  "name": "更新後の施設名",
  "address": "東京都新宿区4-5-6",
  "phone": "03-9876-5432",
  "bed_capacity": 60,
  "acceptance_conditions": "24時間対応、看護師常駐"
}
```

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "user_id": 2,
  "name": "更新後の施設名",
  "address": "東京都新宿区4-5-6",
  "phone": "03-9876-5432",
  "bed_capacity": 60,
  "acceptance_conditions": "24時間対応、看護師常駐",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**エラーレスポンス**:

- 400: バリデーションエラー
- 403: 他の施設を更新しようとした
- 404: 施設が見つからない

---

### 自施設情報取得

ログイン中の施設ユーザーの施設情報を取得します。

**エンドポイント**: `GET /api/facilities/me`

**認証**: 必要（施設ユーザーのみ）

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "user_id": 2,
  "name": "サンプル施設",
  "address": "東京都渋谷区1-2-3",
  "phone": "03-1234-5678",
  "bed_capacity": 50,
  "acceptance_conditions": "24時間対応可能、医療ケア対応",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 404: 施設情報が未登録
- 403: 施設ユーザー以外がアクセス

---

## 書類エンドポイント

### 書類アップロード

書類をアップロードします。

**エンドポイント**: `POST /api/documents`

**認証**: 必要

**リクエスト**: `multipart/form-data`

**フォームフィールド**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | file | はい | アップロードするファイル |
| `title` | string | はい | 書類のタイトル |
| `document_type` | string | いいえ | 書類の種類 |
| `recipient_id` | integer | はい | 送信先ユーザーID |

**レスポンス** (201 Created):

```json
{
  "id": 1,
  "sender_id": 1,
  "recipient_id": 2,
  "title": "患者情報書類",
  "file_path": "/uploads/document_123.pdf",
  "document_type": "patient_info",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 400: ファイルが不正、またはバリデーションエラー
- 413: ファイルサイズが大きすぎる

---

### 書類一覧取得

自分が送信または受信した書類の一覧を取得します。

**エンドポイント**: `GET /api/documents`

**認証**: 必要

**レスポンス** (200 OK):

```json
[
  {
    "id": 1,
    "sender_id": 1,
    "recipient_id": 2,
    "title": "患者情報書類",
    "file_path": "/uploads/document_123.pdf",
    "document_type": "patient_info",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 書類詳細取得

特定の書類の詳細情報を取得します。

**エンドポイント**: `GET /api/documents/:id`

**認証**: 必要（送信者または受信者のみ）

**パスパラメータ**:

- `id`: 書類ID

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "sender_id": 1,
  "recipient_id": 2,
  "title": "患者情報書類",
  "file_path": "/uploads/document_123.pdf",
  "document_type": "patient_info",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 403: アクセス権限がない
- 404: 書類が見つからない

---

### 書類ダウンロード

書類ファイルをダウンロードします。

**エンドポイント**: `GET /api/documents/:id/download`

**認証**: 必要（送信者または受信者のみ）

**パスパラメータ**:

- `id`: 書類ID

**レスポンス** (200 OK):

- Content-Type: ファイルのMIMEタイプ
- ファイルのバイナリデータ

**エラーレスポンス**:

- 403: アクセス権限がない
- 404: ファイルが見つからない

---

## 管理者エンドポイント

### 病院アカウント作成

新しい病院アカウントを作成します。

**エンドポイント**: `POST /api/admin/hospitals`

**認証**: 必要（管理者のみ）

**リクエストボディ**:

```json
{
  "email": "hospital@example.com",
  "password": "securepassword123",
  "name": "サンプル病院",
  "address": "東京都千代田区1-1-1",
  "phone": "03-1111-2222"
}
```

**レスポンス** (201 Created):

```json
{
  "id": 1,
  "user_id": 3,
  "name": "サンプル病院",
  "address": "東京都千代田区1-1-1",
  "phone": "03-1111-2222",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 400: バリデーションエラー
- 403: 管理者以外がアクセス
- 409: メールアドレスが既に使用されている

---

### 病院一覧取得

すべての病院アカウントを取得します。

**エンドポイント**: `GET /api/admin/hospitals`

**認証**: 必要（管理者のみ）

**レスポンス** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 3,
    "name": "サンプル病院",
    "address": "東京都千代田区1-1-1",
    "phone": "03-1111-2222",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 病院情報更新

病院アカウントの情報を更新します。

**エンドポイント**: `PUT /api/admin/hospitals/:id`

**認証**: 必要（管理者のみ）

**パスパラメータ**:

- `id`: 病院ID

**リクエストボディ**:

```json
{
  "name": "更新後の病院名",
  "address": "東京都港区2-2-2",
  "phone": "03-3333-4444"
}
```

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "user_id": 3,
  "name": "更新後の病院名",
  "address": "東京都港区2-2-2",
  "phone": "03-3333-4444",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

### 病院アカウント削除

病院アカウントを削除（非アクティブ化）します。

**エンドポイント**: `DELETE /api/admin/hospitals/:id`

**認証**: 必要（管理者のみ）

**パスパラメータ**:

- `id`: 病院ID

**レスポンス** (200 OK):

```json
{
  "message": "Hospital deleted successfully"
}
```

**注意**: 実際にはデータベースから削除されず、`is_active`フラグが`false`に設定されます。

---

### 施設アカウント作成

新しい施設アカウントを作成します。

**エンドポイント**: `POST /api/admin/facilities`

**認証**: 必要（管理者のみ）

**リクエストボディ**:

```json
{
  "email": "facility@example.com",
  "password": "securepassword123",
  "name": "管理者作成施設",
  "address": "東京都品川区3-3-3",
  "phone": "03-5555-6666",
  "bed_capacity": 40,
  "acceptance_conditions": "要介護1以上"
}
```

**レスポンス** (201 Created):

```json
{
  "id": 2,
  "user_id": 4,
  "name": "管理者作成施設",
  "address": "東京都品川区3-3-3",
  "phone": "03-5555-6666",
  "bed_capacity": 40,
  "acceptance_conditions": "要介護1以上",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 施設一覧取得（管理者）

すべての施設アカウントを取得します。

**エンドポイント**: `GET /api/admin/facilities`

**認証**: 必要（管理者のみ）

**レスポンス** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 2,
    "name": "サンプル施設",
    "address": "東京都渋谷区1-2-3",
    "phone": "03-1234-5678",
    "bed_capacity": 50,
    "acceptance_conditions": "24時間対応可能、医療ケア対応",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 施設情報更新（管理者）

施設アカウントの情報を更新します。

**エンドポイント**: `PUT /api/admin/facilities/:id`

**認証**: 必要（管理者のみ）

**パスパラメータ**:

- `id`: 施設ID

**リクエストボディ**:

```json
{
  "name": "更新後の施設名",
  "address": "東京都目黒区4-4-4",
  "phone": "03-7777-8888",
  "bed_capacity": 45,
  "acceptance_conditions": "要介護2以上"
}
```

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "user_id": 2,
  "name": "更新後の施設名",
  "address": "東京都目黒区4-4-4",
  "phone": "03-7777-8888",
  "bed_capacity": 45,
  "acceptance_conditions": "要介護2以上",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

### 施設アカウント削除

施設アカウントを削除（非アクティブ化）します。

**エンドポイント**: `DELETE /api/admin/facilities/:id`

**認証**: 必要（管理者のみ）

**パスパラメータ**:

- `id`: 施設ID

**レスポンス** (200 OK):

```json
{
  "message": "Facility deleted successfully"
}
```

**注意**: 実際にはデータベースから削除されず、`is_active`フラグが`false`に設定されます。

---

## レート制限

APIには以下のレート制限が適用されます：

### 標準エンドポイント

- 制限: 100リクエスト/分
- 適用対象: ほとんどのGET、PUT、DELETEエンドポイント

### 厳格なエンドポイント

- 制限: 10リクエスト/分
- 適用対象: ログイン、アカウント作成など

レート制限を超えた場合、`429 Too Many Requests`が返されます。

---

## 使用例

### cURLでのログイン例

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 認証付きリクエスト例

```bash
curl -X GET http://localhost:8080/api/facilities \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ファイルアップロード例

```bash
curl -X POST http://localhost:8080/api/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/document.pdf" \
  -F "title=患者情報" \
  -F "document_type=patient_info" \
  -F "recipient_id=2"
```

---

## 変更履歴

### v1.0 (2024-01-01)

- 初版リリース
- 認証、施設管理、書類管理、管理者機能の実装
