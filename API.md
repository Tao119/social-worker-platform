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

## 受け入れリクエストエンドポイント

### 受け入れリクエスト作成

病院が施設に患者の受け入れリクエストを送信します。

**エンドポイント**: `POST /api/requests`

**認証**: 必要（病院ユーザーのみ）

**リクエストボディ**:

```json
{
  "facility_id": 1,
  "patient_age": 80,
  "patient_gender": "男性",
  "medical_condition": "肝臓がん手術後、リハビリ必要"
}
```

**レスポンス** (201 Created):

```json
{
  "id": 1,
  "hospital_id": 1,
  "facility_id": 1,
  "patient_age": 80,
  "patient_gender": "男性",
  "medical_condition": "肝臓がん手術後、リハビリ必要",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 400: 必須フィールドが不足、またはバリデーションエラー
- 403: 病院ユーザー以外がアクセス
- 404: 施設が見つからない

---

### 受け入れリクエスト一覧取得

自分に関連する受け入れリクエストの一覧を取得します。

**エンドポイント**: `GET /api/requests`

**認証**: 必要（病院または施設ユーザー）

**レスポンス** (200 OK):

病院ユーザーの場合、自分が送信したリクエストが返されます。
施設ユーザーの場合、自施設宛のリクエストが返されます。

```json
[
  {
    "id": 1,
    "hospital_id": 1,
    "facility_id": 1,
    "patient_age": 80,
    "patient_gender": "男性",
    "medical_condition": "肝臓がん手術後、リハビリ必要",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 受け入れリクエスト詳細取得

特定の受け入れリクエストの詳細情報を取得します。

**エンドポイント**: `GET /api/requests/:id`

**認証**: 必要（関連する病院または施設ユーザーのみ）

**パスパラメータ**:

- `id`: リクエストID

**レスポンス** (200 OK):

```json
{
  "id": 1,
  "hospital_id": 1,
  "facility_id": 1,
  "patient_age": 80,
  "patient_gender": "男性",
  "medical_condition": "肝臓がん手術後、リハビリ必要",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス**:

- 403: アクセス権限がない
- 404: リクエストが見つからない

---

### 受け入れリクエスト承認

施設が受け入れリクエストを承認し、メッセージルームを作成します。

**エンドポイント**: `POST /api/requests/:id/accept`

**認証**: 必要（施設ユーザーのみ）

**パスパラメータ**:

- `id`: リクエストID

**レスポンス** (200 OK):

```json
{
  "message": "Request accepted"
}
```

**エラーレスポンス**:

- 400: リクエストが既に処理済み
- 403: 施設ユーザー以外がアクセス、または他施設のリクエスト
- 404: リクエストが見つからない

**注意**: 承認後、自動的にメッセージルームが作成されます。

---

### 受け入れリクエスト拒否

施設が受け入れリクエストを拒否します。

**エンドポイント**: `POST /api/requests/:id/reject`

**認証**: 必要（施設ユーザーのみ）

**パスパラメータ**:

- `id`: リクエストID

**レスポンス** (200 OK):

```json
{
  "message": "Request rejected"
}
```

**エラーレスポンス**:

- 400: リクエストが既に処理済み
- 403: 施設ユーザー以外がアクセス、または他施設のリクエスト
- 404: リクエストが見つからない

---

## メッセージルームエンドポイント

### メッセージルーム一覧取得

自分に関連するメッセージルームの一覧を取得します。

**エンドポイント**: `GET /api/rooms`

**認証**: 必要（病院または施設ユーザー）

**レスポンス** (200 OK):

病院ユーザーの場合、自分が関連するルームが返されます。
施設ユーザーの場合、自施設が関連するルームが返されます。

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "request_id": 1,
    "hospital_id": 1,
    "facility_id": 1,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**ステータスの種類**:

- `active`: アクティブ（メッセージ交換可能）
- `accepted`: 最終承認済み（正式な書類交換可能）
- `rejected`: 拒否済み（閉鎖）

---

### メッセージルーム詳細取得

特定のメッセージルームの詳細情報、メッセージ、ファイルを取得します。

**エンドポイント**: `GET /api/rooms/:id`

**認証**: 必要（関連する病院または施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）

**レスポンス** (200 OK):

```json
{
  "room": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "request_id": 1,
    "hospital_id": 1,
    "facility_id": 1,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "messages": [
    {
      "id": 1,
      "room_id": "550e8400-e29b-41d4-a716-446655440000",
      "sender_id": 1,
      "message_text": "患者の詳細について質問があります",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "files": [
    {
      "id": 1,
      "room_id": "550e8400-e29b-41d4-a716-446655440000",
      "sender_id": 1,
      "file_name": "patient_info.pdf",
      "file_path": "./uploads/rooms/1234567890_patient_info.pdf",
      "file_type": ".pdf",
      "file_size": 102400,
      "created_at": "2024-01-01T10:05:00Z"
    }
  ]
}
```

**エラーレスポンス**:

- 403: アクセス権限がない
- 404: ルームが見つからない

---

### メッセージ送信

メッセージルーム内でテキストメッセージを送信します。

**エンドポイント**: `POST /api/rooms/:id/messages`

**認証**: 必要（関連する病院または施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）

**リクエストボディ**:

```json
{
  "message_text": "リハビリ設備について教えてください"
}
```

**レスポンス** (201 Created):

```json
{
  "id": 2,
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": 1,
  "message_text": "リハビリ設備について教えてください",
  "created_at": "2024-01-01T10:10:00Z"
}
```

**エラーレスポンス**:

- 400: メッセージテキストが空
- 403: アクセス権限がない、またはルームが閉鎖済み
- 404: ルームが見つからない

---

### ファイルアップロード

メッセージルーム内でファイルを送信します。

**エンドポイント**: `POST /api/rooms/:id/files`

**認証**: 必要（関連する病院または施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）

**リクエスト**: `multipart/form-data`

**フォームフィールド**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | file | はい | アップロードするファイル |

**レスポンス** (201 Created):

```json
{
  "id": 2,
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": 1,
  "file_name": "medical_record.pdf",
  "file_path": "./uploads/rooms/1234567891_medical_record.pdf",
  "file_type": ".pdf",
  "file_size": 204800,
  "created_at": "2024-01-01T10:15:00Z"
}
```

**エラーレスポンス**:

- 400: ファイルが不正
- 403: アクセス権限がない、またはルームが閉鎖済み
- 404: ルームが見つからない

---

### ファイルダウンロード

メッセージルーム内のファイルをダウンロードします。

**エンドポイント**: `GET /api/rooms/:id/files/:fileId`

**認証**: 必要（関連する病院または施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）
- `fileId`: ファイルID

**レスポンス** (200 OK):

- Content-Type: application/octet-stream
- ファイルのバイナリデータ

**エラーレスポンス**:

- 403: アクセス権限がない
- 404: ファイルが見つからない

---

### 最終承認（施設側）

施設が患者の受け入れを最終承認します。承認後、正式な書類交換が可能になります。

**エンドポイント**: `POST /api/rooms/:id/accept`

**認証**: 必要（施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）

**レスポンス** (200 OK):

```json
{
  "message": "Room accepted"
}
```

**エラーレスポンス**:

- 400: ルームがアクティブ状態ではない
- 403: 施設ユーザー以外がアクセス、または他施設のルーム
- 404: ルームが見つからない

**注意**: 承認後、ルームのステータスが`accepted`に変更されます。

---

### 最終拒否（施設側）

施設が患者の受け入れを最終拒否します。拒否後、ルームは閉鎖されます。

**エンドポイント**: `POST /api/rooms/:id/reject`

**認証**: 必要（施設ユーザーのみ）

**パスパラメータ**:

- `id`: ルームID（UUID）

**レスポンス** (200 OK):

```json
{
  "message": "Room rejected"
}
```

**エラーレスポンス**:

- 400: ルームがアクティブ状態ではない
- 403: 施設ユーザー以外がアクセス、または他施設のルーム
- 404: ルームが見つからない

**注意**: 拒否後、ルームのステータスが`rejected`に変更され、メッセージやファイルの送信ができなくなります。

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
