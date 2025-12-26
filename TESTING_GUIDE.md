# Testing Guide

## Overview

This guide covers testing strategies for the GAdmin Toolkit web application.

---

## Backend Testing

### Unit Tests

Test individual functions and services:

```javascript
// backend/tests/services/authService.test.js
const authService = require('../../src/services/authService');

describe('Auth Service', () => {
  test('should hash password correctly', async () => {
    const password = 'testpassword';
    const hashed = await authService.hashPassword(password);
    expect(hashed).not.toBe(password);
  });

  test('should verify password correctly', async () => {
    const password = 'testpassword';
    const hashed = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword(password, hashed);
    expect(isValid).toBe(true);
  });
});
```

### Integration Tests

Test API endpoints:

```javascript
// backend/tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('Auth Endpoints', () => {
  test('POST /api/auth/login should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
  });
});
```

### Running Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- authService.test.js

# Run in watch mode
npm test -- --watch
```

---

## Frontend Testing

### Component Tests

Test React components:

```javascript
// frontend/tests/components/LoginPage.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../../src/pages/LoginPage';

describe('LoginPage', () => {
  test('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('submits form with credentials', () => {
    const mockSubmit = jest.fn();
    render(<LoginPage onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'admin' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'admin123' }
    });
    fireEvent.click(screen.getByText(/login/i));
    
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## API Testing with curl

### Login

```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### Generate Users

```bash
curl -X POST http://localhost:5000/api/users/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","count":5}'
```

### List Users

```bash
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer $TOKEN"
```

### Create Single User

```bash
curl -X POST http://localhost:5000/api/users/create-single \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123!",
    "firstName":"Test",
    "lastName":"User"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:5000/api/users/test@example.com \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Testing

### Import Collection

1. Open Postman
2. Click Import
3. Paste the following collection:

```json
{
  "info": {
    "name": "GAdmin Toolkit API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login successful', function() {",
                  "  pm.response.to.have.status(200);",
                  "  var jsonData = pm.response.json();",
                  "  pm.environment.set('token', jsonData.data.token);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "List Users",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/users/list",
              "host": ["{{baseUrl}}"],
              "path": ["users", "list"]
            }
          }
        }
      ]
    }
  ]
}
```

### Environment Variables

Create an environment with:
- `baseUrl`: `http://localhost:5000/api`
- `token`: (auto-populated after login)

---

## Load Testing

### Using Apache Bench

```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:5000/api/auth/login

# login.json content:
# {"username":"admin","password":"admin123"}
```

### Using Artillery

```yaml
# load-test.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Login and list users"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "admin"
            password: "admin123"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/users/list"
          headers:
            Authorization: "Bearer {{ token }}"
```

Run:
```bash
artillery run load-test.yml
```

---

## Security Testing

### OWASP ZAP

1. Install OWASP ZAP
2. Configure proxy (localhost:8080)
3. Browse application
4. Run automated scan
5. Review findings

### Manual Security Checks

```bash
# Check for SQL injection (not applicable, but good practice)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin\" OR 1=1--","password":"test"}'

# Check for XSS
curl -X POST http://localhost:5000/api/users/create-single \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>@test.com","password":"test","firstName":"Test","lastName":"User"}'

# Check rate limiting
for i in {1..200}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}' &
done
```

---

## E2E Testing

### Using Playwright

```javascript
// frontend/tests/e2e/login.spec.js
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## CI/CD Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
```

---

## Test Coverage

### Backend Coverage

```bash
cd backend
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Frontend Coverage

```bash
cd frontend
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Troubleshooting Tests

### Common Issues

**"Cannot connect to database"**
- Ensure test database is running
- Check connection string

**"Port already in use"**
- Kill process using the port
- Use different port for tests

**"Tests timeout"**
- Increase timeout in test config
- Check for hung requests

---

## Best Practices

1. **Write tests first** (TDD)
2. **Keep tests isolated**
3. **Use meaningful test names**
4. **Mock external dependencies**
5. **Test edge cases**
6. **Maintain test coverage >80%**
7. **Run tests before commits**
8. **Use CI/CD for automated testing**

---

## Test Checklist

Before deploying:

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] API endpoints tested
- [ ] Frontend components tested
- [ ] E2E tests pass
- [ ] Security tests performed
- [ ] Load tests completed
- [ ] Coverage >80%
- [ ] No console errors
- [ ] Performance acceptable
