# Design Document

## Overview

ソーシャルワーカープラットフォームは、Next.js (JavaScript) フロントエンド、Gin (Go) バックエンド、PostgreSQLデータベースを使用した3層アーキテクチャのwebアプリケーションです。病院と施設間の患者受け入れプロセスを効率化し、患者ごとの受け入れリクエストから専用メッセージルームでのコミュニケーション、最終的な受け入れ判断までをサポートします。管理者が全体を統括します。

## Architecture

### System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend       │
│   (Gin/Go)      │
│   Port: 8080    │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   Database      │
│  (PostgreSQL)   │
│   Port: 5432    │
└─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14+ (JavaScript), React 18+
- **Backend**: Go 1.21+, Gin Web Framework
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API with JSON
- **Version Control**: Git

### Deployment Structure

- Frontend and Backend run as separate services
- Database runs as a containerized service
- Environment-based configuration for development and production

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module

- Login page for all user types
- Session management with JWT tokens
- Role-based route protection

#### 2. Hospital User Interface

- Facility search page with filters
- Facility detail view
- Placement request creation form
- Message room list
- Message room interface (messages and file exchange)
- Dashboard

#### 3. Facility User Interface

- Facility information registration form
- Facility information edit form
- Placement request notifications and list
- Message room list
- Message room interface (messages, file exchange, final acceptance controls)
- Dashboard

#### 4. Admin User Interface

- Hospital account management (CRUD)
- Facility account management (CRUD)
- System overview dashboard

### Backend API Endpoints

#### Authentication Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

#### Facility Endpoints

```
POST   /api/facilities          (Facility user: create)
GET    /api/facilities          (Hospital user: list/search)
GET    /api/facilities/:id      (Hospital user: view details)
PUT    /api/facilities/:id      (Facility user: update own)
GET    /api/facilities/me       (Facility user: view own)
```

#### Document Endpoints

```
POST   /api/documents           (Upload document)
GET    /api/documents           (List user's documents)
GET    /api/documents/:id       (View document details)
```

#### Placement Request Endpoints

```
POST   /api/requests            (Hospital: create placement request)
GET    /api/requests            (List user's requests)
GET    /api/requests/:id        (View request details)
POST   /api/requests/:id/accept (Facility: accept request, create room)
POST   /api/requests/:id/reject (Facility: reject request)
```

#### Message Room Endpoints

```
GET    /api/rooms               (List user's message rooms)
GET    /api/rooms/:id           (View room details and messages)
POST   /api/rooms/:id/messages  (Send text message)
POST   /api/rooms/:id/files     (Send file attachment)
GET    /api/rooms/:id/files/:fileId (Download file)
POST   /api/rooms/:id/accept    (Facility: final acceptance)
POST   /api/rooms/:id/reject    (Facility: final rejection)
```

#### Admin Endpoints

```
POST   /api/admin/hospitals     (Create hospital account)
GET    /api/admin/hospitals     (List all hospitals)
PUT    /api/admin/hospitals/:id (Update hospital)
DELETE /api/admin/hospitals/:id (Delete hospital)

POST   /api/admin/facilities    (Create facility account)
GET    /api/admin/facilities    (List all facilities)
PUT    /api/admin/facilities/:id (Update facility)
DELETE /api/admin/facilities/:id (Delete facility)
```

### Middleware

1. **Authentication Middleware**: Validates JWT tokens
2. **Authorization Middleware**: Checks user roles
3. **CORS Middleware**: Handles cross-origin requests
4. **Logging Middleware**: Logs all requests
5. **Error Handling Middleware**: Standardizes error responses

## Data Models

### User Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('hospital', 'facility', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Hospital Table

```sql
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Facility Table

```sql
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    bed_capacity INTEGER,
    acceptance_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Document Table

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    document_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Placement Request Table

```sql
CREATE TABLE placement_requests (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    patient_age INTEGER NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    medical_condition TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Message Room Table

```sql
CREATE TABLE message_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id INTEGER REFERENCES placement_requests(id) ON DELETE CASCADE UNIQUE,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Message Table

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_id UUID REFERENCES message_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Room File Table

```sql
CREATE TABLE room_files (
    id SERIAL PRIMARY KEY,
    room_id UUID REFERENCES message_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_facilities_user_id ON facilities(user_id);
CREATE INDEX idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX idx_documents_sender ON documents(sender_id);
CREATE INDEX idx_documents_recipient ON documents(recipient_id);
CREATE INDEX idx_placement_requests_hospital ON placement_requests(hospital_id);
CREATE INDEX idx_placement_requests_facility ON placement_requests(facility_id);
CREATE INDEX idx_placement_requests_status ON placement_requests(status);
CREATE INDEX idx_message_rooms_hospital ON message_rooms(hospital_id);
CREATE INDEX idx_message_rooms_facility ON message_rooms(facility_id);
CREATE INDEX idx_message_rooms_request ON message_rooms(request_id);
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_room_files_room ON room_files(room_id);
CREATE INDEX idx_room_files_sender ON room_files(sender_id);
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: User role assignment

_For any_ user account created in the system, the user must have exactly one role from the set {hospital, facility, admin}
**Validates: Requirements 1.1**

### Property 2: Valid credentials authenticate successfully

_For any_ user with valid credentials (correct email and password), attempting to log in should return a valid JWT session token
**Validates: Requirements 1.2**

### Property 3: Invalid credentials are rejected

_For any_ login attempt with invalid credentials (wrong password or non-existent email), the system should return an authentication error and no session token
**Validates: Requirements 1.3**

### Property 4: Logout invalidates session

_For any_ valid session token, after logging out, subsequent requests using that token should fail with an authentication error
**Validates: Requirements 1.4**

### Property 5: Role-based access control

_For any_ protected endpoint and any user, if the user's role does not have permission for that endpoint, the request should return an authorization error
**Validates: Requirements 1.5**

### Property 6: Expired sessions require re-authentication

_For any_ expired session token, requests using that token should fail with an authentication error requiring re-login
**Validates: Requirements 1.6**

### Property 7: Facility creation stores all fields

_For any_ valid facility data submitted by a facility user, all fields (name, bed capacity, acceptance conditions, contact info, location) should be persisted and retrievable
**Validates: Requirements 2.1**

### Property 8: Facility updates are persisted

_For any_ facility and any valid update data, after updating the facility, retrieving it should return the updated values
**Validates: Requirements 2.2**

### Property 9: Unauthorized facility modification is prevented

_For any_ facility and any user who is not the facility owner or admin, attempts to modify the facility should return an authorization error
**Validates: Requirements 2.3**

### Property 10: Required fields validation

_For any_ facility data with empty required fields (name, bed capacity), the system should reject the creation/update and return a validation error
**Validates: Requirements 2.4**

### Property 11: Facility owners can view their data

_For any_ facility user, they should be able to retrieve their own facility information successfully
**Validates: Requirements 2.5**

### Property 12: Search returns matching facilities

_For any_ search criteria and facility dataset, all returned facilities should match the search criteria, and all matching facilities should be in the results
**Validates: Requirements 3.1**

### Property 13: Filtering works correctly

_For any_ filter criteria (bed availability, acceptance conditions, location) and facility dataset, all returned facilities should satisfy the filter criteria
**Validates: Requirements 3.2**

### Property 14: Facility details contain all information

_For any_ facility, when a hospital user views its details, the response should contain all facility fields (name, address, phone, bed capacity, acceptance conditions)
**Validates: Requirements 3.3**

### Property 15: Facility users cannot search

_For any_ facility user, attempting to access the facility search endpoint should return an authorization error
**Validates: Requirements 3.4**

### Property 16: Placement request stores complete patient data

_For any_ placement request created by a hospital, all patient summary fields (age, gender, medical condition) and facility association should be persisted and retrievable
**Validates: Requirements 4.1, 4.3**

### Property 17: Placement request notification is created

_For any_ placement request created, a notification record should be created for the facility user
**Validates: Requirements 4.2**

### Property 18: Request acceptance creates unique room

_For any_ placement request accepted by a facility, a message room with a unique UUID should be created and associated with the hospital, facility, and request
**Validates: Requirements 4.4, 4.6**

### Property 19: Request rejection prevents further actions

_For any_ placement request rejected by a facility, the request status should be marked as rejected and subsequent room creation attempts should fail
**Validates: Requirements 4.5**

### Property 20: Room associations are complete

_For any_ message room, it should be associated with exactly one hospital, one facility, and one placement request (patient)
**Validates: Requirements 4.7**

### Property 21: One request per patient

_For any_ placement request, it should contain data for exactly one patient (not multiple patients)
**Validates: Requirements 4.8**

### Property 22: Room access is restricted

_For any_ message room and any user not associated with that room (neither hospital nor facility), attempts to access the room should return an authorization error
**Validates: Requirements 4.9**

### Property 23: Active rooms allow message and file sending

_For any_ active message room and any user associated with that room (hospital or facility), they should be able to send both text messages and file attachments
**Validates: Requirements 5.1, 5.2**

### Property 24: Messages and files have complete metadata

_For any_ message or file sent in a room, it should have complete metadata including sender ID, timestamp, and content-specific fields (message text or file name/type/size)
**Validates: Requirements 5.3, 5.4**

### Property 25: Room content is chronologically ordered

_For any_ message room, when retrieving messages and files, they should be ordered by creation timestamp (chronological order)
**Validates: Requirements 5.5**

### Property 26: Unauthorized sending is prevented

_For any_ user not associated with a room, attempts to send messages or files should return an authorization error
**Validates: Requirements 5.6**

### Property 27: Final acceptance controls are facility-only

_For any_ hospital user, attempts to perform final acceptance or rejection should return an authorization error
**Validates: Requirements 5.7, 6.6**

### Property 28: Final acceptance enables document exchange

_For any_ message room where a facility user performs final acceptance, the room status should change to "accepted" and formal document exchange operations should be enabled
**Validates: Requirements 6.2, 6.5**

### Property 29: Final rejection closes room

_For any_ message room where a facility user performs final rejection, the room status should change to "rejected" and further message/file exchanges should be prevented
**Validates: Requirements 6.3, 6.4**

### Property 30: Room status is valid

_For any_ message room at any point in time, its status should be one of the valid values (active, accepted, rejected) and status transitions should follow the defined lifecycle
**Validates: Requirements 6.7**

### Property 31: Admin creates hospital accounts

_For any_ valid hospital data submitted by an admin, both a user record (with role=hospital) and a hospital record should be created
**Validates: Requirements 5.1**

### Property 31: Admin creates hospital accounts

_For any_ valid hospital data submitted by an admin, both a user record (with role=hospital) and a hospital record should be created
**Validates: Requirements 7.1**

### Property 32: Admin creates facility accounts

_For any_ valid facility data submitted by an admin, both a user record (with role=facility) and a facility record should be created
**Validates: Requirements 7.2**

### Property 33: Admin updates are persisted

_For any_ hospital or facility and any valid update data from an admin, the updates should be persisted and retrievable
**Validates: Requirements 7.3**

### Property 34: Account deletion marks inactive

_For any_ account deleted by an admin, the account should be marked as inactive (is_active=false) and login attempts should fail
**Validates: Requirements 7.4**

### Property 35: Admin can view all entities

_For any_ admin user, they should be able to retrieve lists of all hospitals and all facilities in the system
**Validates: Requirements 7.5**

### Property 36: Non-admins cannot access admin functions

_For any_ non-admin user (hospital or facility), attempting to access admin endpoints should return an authorization error
**Validates: Requirements 7.6**

### Property 37: Data persistence round trip

_For any_ data entity (user, hospital, facility, placement request, message room, message, file), after creating it, retrieving it should return equivalent data
**Validates: Requirements 8.1**

### Property 38: Database errors return appropriate messages

_For any_ database connection failure or query error, the API should return an appropriate error response (not crash)
**Validates: Requirements 8.3**

### Property 39: Referential integrity is enforced

_For any_ user record, deleting it should cascade delete or prevent deletion if related records (hospital, facility, requests, rooms) exist
**Validates: Requirements 8.4**

### Property 40: API responses are valid JSON

_For any_ API endpoint response, the response body should be valid JSON format
**Validates: Requirements 9.2**

### Property 41: Failed requests return proper status codes

_For any_ failed API request, the response should include an appropriate HTTP status code (4xx for client errors, 5xx for server errors) and an error message
**Validates: Requirements 9.3**

### Property 42: Invalid input is rejected

_For any_ API endpoint and any invalid input data, the request should be rejected with a validation error before processing
**Validates: Requirements 9.4**

### Property 43: Passwords are encrypted

_For any_ user account, the password stored in the database should be hashed (not plain text)
**Validates: Requirements 10.1**

### Property 44: Session tokens are secure

_For any_ generated session token, it should be a valid JWT with proper signature and expiration
**Validates: Requirements 10.2**

### Property 45: Malicious input is sanitized

_For any_ user input containing potentially malicious content (SQL injection, XSS), the system should sanitize or reject it
**Validates: Requirements 10.3**

### Property 46: Rate limiting prevents abuse

_For any_ user making excessive requests in a short time period, subsequent requests should be rate limited with 429 status code
**Validates: Requirements 10.5**

## Error Handling

### Error Response Format

All API errors should follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error Categories

1. **Authentication Errors (401)**
   - Invalid credentials
   - Expired session
   - Missing authentication token

2. **Authorization Errors (403)**
   - Insufficient permissions
   - Role-based access denied

3. **Validation Errors (400)**
   - Missing required fields
   - Invalid data format
   - Business rule violations

4. **Not Found Errors (404)**
   - Resource does not exist

5. **Server Errors (500)**
   - Database connection failures
   - Unexpected errors

### Error Handling Strategy

- All errors should be logged with appropriate context
- Sensitive information should not be exposed in error messages
- Database errors should be caught and converted to user-friendly messages
- Frontend should display user-friendly error messages based on error codes

## Testing Strategy

### Dual Testing Approach

This system will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Framework**: We will use a property-based testing library appropriate for each language:

- **Go (Backend)**: `gopter` or `rapid` for property-based testing
- **JavaScript (Frontend)**: `fast-check` for property-based testing

**Configuration**:

- Each property test must run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: social-worker-platform, Property N: [property text]`

**Implementation Requirements**:

- Each correctness property listed above must be implemented as a single property-based test
- Tests should generate random valid inputs to verify properties hold universally
- Tests should be placed close to the implementation to catch errors early

### Unit Testing

**Focus Areas**:

- Specific examples demonstrating correct behavior
- Edge cases (empty results, boundary values)
- Error conditions (invalid input, database failures)
- Integration points between components

**Balance**:

- Avoid writing too many unit tests for scenarios covered by property tests
- Focus unit tests on concrete examples and integration scenarios
- Use property tests for comprehensive input coverage

### Test Organization

```
backend/
  handlers/
    auth_handler.go
    auth_handler_test.go        # Unit tests
    auth_handler_property_test.go  # Property tests
  models/
    user.go
    user_test.go
    user_property_test.go

frontend/
  components/
    LoginForm.jsx
    LoginForm.test.js
  lib/
    api.js
    api.test.js
    api.property.test.js
```

### Integration Testing

- Test complete API flows (e.g., create account → login → perform action)
- Test database transactions and rollbacks
- Test authentication and authorization flows
- Test error handling across layers

### Testing Tools

- **Go Backend**: `testing` package, `testify` for assertions, `gopter` for property tests
- **JavaScript Frontend**: Jest, React Testing Library, `fast-check` for property tests
- **Database**: Test database with migrations, cleanup between tests
- **API Testing**: HTTP client tests for endpoint validation
