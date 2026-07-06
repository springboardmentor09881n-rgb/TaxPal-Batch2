# Authentication API Documentation

## Base URL
`/api/auth`

## 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user in the system.

**Request Body:**
```json
{
  "name": "Rehan",
  "email": "rehan@example.com",
  "password": "password123",
  "country": "India",
  "incomeBracket": "Middle"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "Rehan",
      "email": "rehan@example.com",
      "country": "India",
      "income_bracket": "Middle",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (missing fields, weak password).
- `400 Bad Request` - User already exists.

---

## 2. Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate an existing user and get a JWT token.

**Request Body:**
```json
{
  "email": "rehan@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials.

---

## 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Fetch the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "Rehan",
      "email": "rehan@example.com",
      "country": "India",
      "income_bracket": "Middle"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authorized, token failed or no token.
