# 📊 API Contract - Google Workspace Automation Toolkit

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
Login and get JWT token

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### POST /auth/register
Register new user (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "username": "newuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### GET /auth/me
Get current user information

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/verify
Verify JWT token validity

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "id": "admin",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

---

## 👥 User Management Endpoints

### POST /users/generate
Generate random user data

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "domain": "example.com",
  "count": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 50 users successfully",
  "data": {
    "count": 50,
    "users": [
      {
        "email": "john.doe@example.com",
        "password": "Password123@",
        "givenName": "John",
        "familyName": "Doe"
      }
    ]
  }
}
```

### POST /users/create
Create users from CSV file

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "csvPath": "/path/to/user_list.csv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User creation completed",
  "data": {
    "total": 50,
    "created": 48,
    "failed": 2,
    "results": [
      {
        "success": true,
        "email": "john.doe@example.com",
        "data": { /* Google API response */ }
      }
    ]
  }
}
```

### POST /users/create-single
Create a single user

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "kind": "admin#directory#user",
    "id": "1234567890",
    "primaryEmail": "john.doe@example.com",
    "name": {
      "givenName": "John",
      "familyName": "Doe",
      "fullName": "John Doe"
    }
  }
}
```

### DELETE /users/:userKey
Delete a single user

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `userKey`: User ID or email

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "success": true,
    "userKey": "john.doe@example.com"
  }
}
```

### DELETE /users/delete-all
Delete all users except admin

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk user deletion completed",
  "data": {
    "total": 50,
    "deleted": 48,
    "failed": 2,
    "results": [
      {
        "success": true,
        "userId": "1234567890",
        "email": "john.doe@example.com"
      }
    ]
  }
}
```

### GET /users/list
List all users

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `excludeAdmin` (boolean): Exclude admin user from results (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 50,
    "users": [
      {
        "kind": "admin#directory#user",
        "id": "1234567890",
        "primaryEmail": "john.doe@example.com",
        "name": {
          "givenName": "John",
          "familyName": "Doe",
          "fullName": "John Doe"
        },
        "suspended": false,
        "creationTime": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /users/import-csv
Import CSV file and create users

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: CSV file with columns: email, password, givenName, familyName

**Response:**
```json
{
  "success": true,
  "message": "CSV import completed",
  "data": {
    "total": 50,
    "created": 48,
    "failed": 2,
    "results": []
  }
}
```

---

## 🔄 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message description"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 📝 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔒 Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)

---

## ⏱️ Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per window
- **Response:** 429 Too Many Requests

---

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# List users (with token)
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create user
curl -X POST http://localhost:5000/api/users/create-single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Using Postman

1. Import the API collection (available at `/api-docs`)
2. Set environment variable for `token`
3. Login to get token
4. Use token for protected endpoints

---

## 📚 Interactive Documentation

Swagger UI available at:
```
http://localhost:5000/api-docs
```

---

## 🐛 Debugging

Enable detailed error messages:
```bash
NODE_ENV=development npm start
```

This will include stack traces in error responses.
