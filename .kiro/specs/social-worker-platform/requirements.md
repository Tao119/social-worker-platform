# Requirements Document

## Introduction

ソーシャルワーカー向けのwebアプリケーションは、病院と施設間の患者受け入れプロセスを効率化するためのプラットフォームです。病院側は適切な受け入れ施設を検索・閲覧でき、患者ごとに受け入れリクエストを送信できます。施設側は自施設の情報を登録・管理し、受け入れリクエストを承認・拒否できます。承認後は専用のメッセージルームで詳細をすり合わせ、最終的な受け入れ判断を行います。管理者が全体を統括します。

## Glossary

- **System**: ソーシャルワーカープラットフォーム全体
- **Hospital_User**: 病院側のユーザーアカウント
- **Facility_User**: 施設側のユーザーアカウント
- **Admin_User**: 管理者アカウント
- **Facility_Info**: 施設情報（病床数、受け入れ条件など）
- **Placement_Request**: 病院から施設への患者受け入れリクエスト
- **Patient_Summary**: 患者の基本情報（年齢、性別、医療状態）
- **Message_Room**: 病院と施設間の1対1コミュニケーションルーム
- **Room_ID**: メッセージルームの一意な識別子（UUID）
- **Message**: メッセージルーム内のテキストメッセージ
- **File_Attachment**: メッセージルーム内のファイル添付
- **Room_Status**: メッセージルームの状態（pending, accepted, rejected）
- **Authentication_System**: 認証システム
- **Database**: PostgreSQLデータベース
- **Frontend**: Next.js (JavaScript)で構築されたフロントエンド
- **Backend**: Gin (Go)で構築されたバックエンドAPI

## Requirements

### Requirement 1: ユーザー認証とアカウント管理

**User Story:** As a user (hospital, facility, or admin), I want to securely authenticate and manage my account, so that I can access the appropriate features for my role.

#### Acceptance Criteria

1. THE Authentication_System SHALL support three distinct user roles: Hospital_User, Facility_User, and Admin_User
2. WHEN a user attempts to log in with valid credentials, THE System SHALL authenticate the user and create a session
3. WHEN a user attempts to log in with invalid credentials, THE System SHALL reject the authentication and return an error message
4. WHEN a user logs out, THE System SHALL terminate the session and clear authentication tokens
5. THE System SHALL enforce role-based access control for all protected endpoints
6. WHEN a user session expires, THE System SHALL require re-authentication

### Requirement 2: 施設情報の登録と管理

**User Story:** As a facility user, I want to register and manage my facility information, so that hospitals can find and contact us for patient placement.

#### Acceptance Criteria

1. WHEN a Facility_User creates facility information, THE System SHALL store the facility name, bed capacity, acceptance conditions, contact information, and location
2. WHEN a Facility_User updates facility information, THE System SHALL validate the changes and persist them to the Database
3. THE System SHALL prevent unauthorized users from modifying Facility_Info
4. WHEN facility information is saved, THE System SHALL validate that required fields are not empty
5. THE System SHALL allow a Facility_User to view their own facility information at any time

### Requirement 3: 施設情報の検索と閲覧

**User Story:** As a hospital user, I want to search and view facility information, so that I can find appropriate placement options for patients.

#### Acceptance Criteria

1. WHEN a Hospital_User searches for facilities, THE System SHALL return a list of facilities matching the search criteria
2. THE System SHALL support filtering by bed availability, acceptance conditions, and location
3. WHEN a Hospital_User views facility details, THE System SHALL display all relevant facility information
4. THE System SHALL prevent Facility_User from accessing the facility search functionality
5. WHEN no facilities match the search criteria, THE System SHALL return an empty result set with an appropriate message

### Requirement 4: 受け入れリクエストとメッセージルーム機能

**User Story:** As a hospital user, I want to send patient placement requests to facilities and communicate through a dedicated message room, so that we can coordinate patient placement efficiently.

#### Acceptance Criteria

1. WHEN a Hospital_User sends a placement request to a facility, THE System SHALL create a request with patient summary information (age, gender, medical condition)
2. WHEN a placement request is created, THE System SHALL notify the Facility_User
3. WHEN a Facility_User views a placement request, THE System SHALL display the patient summary information
4. WHEN a Facility_User accepts a placement request, THE System SHALL create a unique message room for that hospital-facility-patient combination
5. WHEN a Facility_User rejects a placement request, THE System SHALL mark the request as rejected and prevent further actions
6. THE System SHALL generate a unique room ID (UUID) for each accepted placement request
7. THE System SHALL associate each message room with exactly one hospital, one facility, and one patient
8. WHEN multiple patients need placement, THE System SHALL require separate placement requests for each patient
9. THE System SHALL prevent unauthorized users from accessing message rooms they are not associated with

### Requirement 5: メッセージルーム内のコミュニケーション

**User Story:** As a hospital or facility user in an active message room, I want to exchange messages and files, so that we can discuss patient placement details.

#### Acceptance Criteria

1. WHEN a message room is active, THE System SHALL allow both Hospital_User and Facility_User to send text messages
2. WHEN a message room is active, THE System SHALL allow both Hospital_User and Facility_User to send file attachments
3. WHEN a message is sent, THE System SHALL store the message with sender information and timestamp
4. WHEN a file is sent, THE System SHALL store the file with metadata (sender, timestamp, file type, file name)
5. WHEN a user views a message room, THE System SHALL display all messages and files in chronological order
6. THE System SHALL prevent users from sending messages or files in rooms they are not associated with
7. THE System SHALL display the final acceptance/rejection controls only to the Facility_User

### Requirement 6: 最終受け入れ承認プロセス

**User Story:** As a facility user, I want to make a final acceptance decision after discussing details, so that we can proceed with formal placement procedures or decline the request.

#### Acceptance Criteria

1. WHEN a Facility_User is in an active message room, THE System SHALL display final acceptance and rejection controls
2. WHEN a Facility_User performs final acceptance, THE System SHALL mark the room as "accepted" and enable formal document exchange
3. WHEN a Facility_User performs final rejection, THE System SHALL mark the room as "rejected" and close the room
4. WHEN a room is closed (rejected), THE System SHALL prevent further message or file exchanges
5. WHEN a room is accepted, THE System SHALL allow exchange of formal placement documents
6. THE System SHALL prevent Hospital_User from accessing final acceptance/rejection controls
7. THE System SHALL maintain room status (pending, accepted, rejected) throughout the lifecycle

### Requirement 7: 管理者機能

**User Story:** As an admin user, I want to manage hospital and facility accounts, so that I can maintain the platform and ensure data quality.

#### Acceptance Criteria

1. WHEN an Admin_User creates a new hospital account, THE System SHALL store the hospital information and create authentication credentials
2. WHEN an Admin_User creates a new facility account, THE System SHALL store the facility information and create authentication credentials
3. WHEN an Admin_User updates hospital or facility information, THE System SHALL validate and persist the changes
4. WHEN an Admin_User deletes an account, THE System SHALL mark the account as inactive and prevent login
5. THE System SHALL allow Admin_User to view all hospitals and facilities in the system
6. THE System SHALL prevent non-admin users from accessing administrative functions

### Requirement 8: データの永続化

**User Story:** As a system architect, I want all data to be stored in PostgreSQL, so that we have reliable and consistent data storage.

#### Acceptance Criteria

1. WHEN any data is created or modified, THE System SHALL persist it to the Database
2. THE Backend SHALL use appropriate database transactions to ensure data consistency
3. THE System SHALL handle database connection errors gracefully and return appropriate error messages
4. THE Database SHALL enforce referential integrity between related entities
5. THE System SHALL use prepared statements to prevent SQL injection attacks

### Requirement 9: APIアーキテクチャ

**User Story:** As a developer, I want a clear separation between frontend and backend, so that the system is maintainable and scalable.

#### Acceptance Criteria

1. THE Frontend SHALL communicate with the Backend exclusively through RESTful API endpoints
2. THE Backend SHALL return responses in JSON format
3. WHEN an API request fails, THE Backend SHALL return appropriate HTTP status codes and error messages
4. THE Backend SHALL validate all incoming request data before processing
5. THE System SHALL use CORS configuration to allow Frontend to communicate with Backend

### Requirement 10: セキュリティとデータ保護

**User Story:** As a system administrator, I want the system to protect sensitive data, so that we comply with privacy regulations and maintain user trust.

#### Acceptance Criteria

1. THE System SHALL encrypt passwords before storing them in the Database
2. THE System SHALL use secure session tokens for authentication
3. THE Backend SHALL validate and sanitize all user input to prevent injection attacks
4. THE System SHALL use HTTPS for all communications in production
5. THE System SHALL implement rate limiting to prevent abuse
