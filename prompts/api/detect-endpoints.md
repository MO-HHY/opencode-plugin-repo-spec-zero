version=2
## Repository Analysis Context

{previous_context}

---

## Key Files Content

{key_files}

---

## Repository Structure

```
{repo_structure}
```

---

## Analysis Task: API Endpoints Documentation

You are an expert API documentation assistant. Analyze this codebase to extract comprehensive documentation for all exposed HTTP API endpoints.

### API Discovery Strategy

1. **Framework Detection** (check for):
   - Express.js: `app.get/post/put/delete`, `Router()`
   - Fastify: `fastify.route`, decorators
   - NestJS: `@Controller`, `@Get/@Post/@Put/@Delete`
   - Koa: `router.get/post`
   - Hono: `app.get/post`
   - Django/DRF: `urlpatterns`, `@api_view`
   - Flask: `@app.route`
   - FastAPI: `@app.get/post`
   - Spring Boot: `@RestController`, `@RequestMapping`
   - Go: `http.HandleFunc`, Gin/Echo handlers

2. **API Specification Files**:
   - OpenAPI/Swagger: `openapi.yaml`, `swagger.json`
   - GraphQL: `schema.graphql`, SDL definitions
   - gRPC: `.proto` files
   - tRPC: Router definitions

3. **Route Registration**:
   - Centralized route files
   - Decorator-based registration
   - Convention-based (file-system routing)

### Required Sections

#### 1. Executive Summary

Provide 3-5 sentences describing:
- API style (REST, GraphQL, gRPC, hybrid)
- Total number of endpoints
- Authentication mechanism overview
- API versioning strategy (if any)

#### 2. API Overview

| Category | Count | Base Path | Auth Required |
|----------|-------|-----------|---------------|
| Users | 5 | /api/users | Yes |
| Products | 8 | /api/products | Mixed |
| Auth | 3 | /api/auth | No |
| Health | 2 | /health | No |

#### 3. Endpoint Catalog

##### Authentication Endpoints

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | /api/auth/login | auth.controller.ts:25 | No | User login |
| POST | /api/auth/register | auth.controller.ts:45 | No | User registration |
| POST | /api/auth/refresh | auth.controller.ts:70 | Yes | Token refresh |

##### [Category] Endpoints

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | /api/users | users.controller.ts:10 | Yes | List all users |
| GET | /api/users/:id | users.controller.ts:25 | Yes | Get user by ID |
| POST | /api/users | users.controller.ts:40 | Admin | Create user |
| PUT | /api/users/:id | users.controller.ts:60 | Yes | Update user |
| DELETE | /api/users/:id | users.controller.ts:80 | Admin | Delete user |

#### 4. Endpoint Details

For each significant endpoint:

---

##### `POST /api/users`

**Handler:** `src/controllers/users.controller.ts:40`

**Description:** Creates a new user account

**Authentication:** Required (Admin role)

**Path Parameters:** None

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| - | - | - | None |

**Request Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "role": "string (optional, default: 'user')"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "string",
  "createdAt": "ISO8601 datetime"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 409 | CONFLICT | Email already exists |

**Validation Rules:**
- Email must be valid format
- Password minimum 8 characters
- Name cannot be empty

---

#### 5. Request/Response Patterns

**Common Request Headers:**
| Header | Purpose | Required |
|--------|---------|----------|
| Authorization | Bearer JWT token | Most endpoints |
| Content-Type | Request body format | POST/PUT/PATCH |
| X-Request-ID | Correlation ID | Optional |

**Common Response Structure:**
```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response Structure:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ /* validation errors */ ]
  }
}
```

#### 6. Authentication & Authorization

| Mechanism | Type | Endpoints | Notes |
|-----------|------|-----------|-------|
| JWT Bearer | Header | Most | Access token in Authorization header |
| API Key | Header | /api/webhooks | X-API-Key header |
| Session | Cookie | Legacy | Deprecated |

**Role-Based Access:**
| Role | Permissions |
|------|-------------|
| admin | Full access |
| user | Read own, write own |
| guest | Read public only |

#### 7. Rate Limiting

| Endpoint Pattern | Limit | Window | Scope |
|------------------|-------|--------|-------|
| /api/auth/* | 5 | 1 min | IP |
| /api/* | 100 | 1 min | User |
| /api/public/* | 30 | 1 min | IP |

#### 8. API Versioning

| Version | Base Path | Status | Notes |
|---------|-----------|--------|-------|
| v1 | /api/v1 | Deprecated | Sunset: 2024-12-01 |
| v2 | /api/v2 | Current | - |
| v3 | /api/v3 | Beta | Feature flagged |

#### 9. GraphQL (if applicable)

**Endpoint:** `POST /graphql`

**Queries:**
| Query | Arguments | Returns | Description |
|-------|-----------|---------|-------------|
| users | filter, pagination | [User] | List users |
| user | id | User | Get single user |

**Mutations:**
| Mutation | Arguments | Returns | Description |
|----------|-----------|---------|-------------|
| createUser | input | User | Create user |
| updateUser | id, input | User | Update user |

#### 10. Cross-References

Link to related analysis sections:

- Entities returned by APIs: [[{project}:spec:entity|returns]]
- Authentication mechanism: [[{project}:spec:auth|protects]]
- Modules implementing APIs: [[{project}:spec:module|implements]]

---

## Output Requirements

**YAML Frontmatter** (required at start of output):
```yaml
---
uid: "{project}:spec:api"
title: "API Endpoints"
status: draft
version: 1
created: {date}
prompt_version: 2
---
```

**Special Instruction:** If no HTTP API is found after comprehensive scan, return:
```yaml
---
uid: "{project}:spec:api"
title: "API Endpoints"
status: not_applicable
version: 1
created: {date}
prompt_version: 2
---

## No HTTP API Detected

This codebase does not contain HTTP API endpoints.
```

**Citation Rules:**
- Always cite handler file paths with line numbers: `src/controllers/users.ts:25`
- Use `NOT_FOUND` if handler location cannot be determined
- Include example payloads based on actual code

**Format:**
- Use clean Markdown with tables
- Group endpoints by resource/domain
- Include JSON examples for complex payloads

**Special Instructions:**
- Ignore files under 'arch-docs' or similar documentation folders
- Include both public and internal APIs
- Note deprecated or beta endpoints
- Document rate limits if found
