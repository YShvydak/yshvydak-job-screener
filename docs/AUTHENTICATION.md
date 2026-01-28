# Authentication & Multi-User Support

This document describes the multi-user authentication system implemented in YShvydak Job Screener.

---

## 🚀 Quick Start

### 1. Configure Environment

Ensure your `.env` file has the following settings:

```bash
# Enable authentication (set to true for multi-user mode)
ENABLE_AUTH=true

# JWT Secret (must be secure and at least 32 chars)
JWT_SECRET=your_super_secret_jwt_key_changed_in_production
JWT_EXPIRES_IN=30d
```

### 2. Start Application

```bash
npm run dev
```

### 3. Register & Login

1. Open `http://localhost:3000`
2. You will be redirected to `/login`
3. Click "Register" to create a new account
4. Enter email and password (min 6 chars)
5. You will be automatically logged in

---

## 🏗️ Architecture

The system uses a **Stateless JWT Authentication** architecture with **Per-User Data Isolation**.

### 1. Auth Flow

1. **Registration/Login:** User sends credentials -> Server validates & returns JWT token.
2. **Token Storage:** Frontend stores JWT in `localStorage`.
3. **Request Interception:** `authFetch` utility intercepts all API requests and adds `Authorization: Bearer <token>` header.
4. **Middleware Verification:** Backend `AuthMiddleware` verifies token signature and expiration.
5. **Generates Context:** Middleware attaches `userId` to the request object (`req.user`).

### 2. Data Isolation (The most important part!)

All data is isolated per user at the **Repository Layer**. No user can see or modify another user's data.

- **Jobs:** `SELECT * FROM jobs WHERE user_id = ?`
- **Profiles:** `SELECT * FROM search_profiles WHERE user_id = ?`
- **Settings:** `SELECT * FROM settings WHERE user_id = ?`
- **CVs:** Stored in settings, specific to user.

### 3. Security Features

- **Passwords:** Hashed using `bcryptjs` (10 rounds).
- **Tokens:** Signed with `HS256` using `JWT_SECRET`.
- **Protected Routes:** All API endpoints (except `/auth/*` and `/health`) require authentication.
- **SQL Injection Protection:** All queries use parameterized inputs.

---

## 📝 API Endpoints

### Public

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and get token
- `GET /health` - Server health check

### Protected (Requires Bearer Token)

- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Invalidate session (client-side)
- `GET /api/jobs` - List **your** jobs
- `GET /api/profiles` - List **your** profiles
- `POST /api/settings/cv` - Upload **your** CV

---

## 🐛 Troubleshooting

### "Unique Constraint Failed"

If you see this error when searching for jobs, it usually means the database migration for multi-user support wasn't fully applied to your local database.
**Fix:** Run `npm run dev` again, or check `docs/ai/ANTI_PATTERNS.md`.

### "No token provided"

You are trying to access a protected route without logging in.
**Fix:** Go to `/login` and sign in.

### "Invalid email or password"

Double check your credentials. If you are developing locally and cleared the database, you may need to register again.

---

## 🔄 Migration from Single-User

If you have an existing single-user database:

1. The migration `002_add_user_authentication.sql` will add `user_id` column.
2. Existing data will have `NULL` user_id and **will not be visible** in the app.
3. You can manually assign them to a user via SQL:
    ```sql
    UPDATE jobs SET user_id = 'your-new-user-uuid' WHERE user_id IS NULL;
    UPDATE search_profiles SET user_id = 'your-new-user-uuid' WHERE user_id IS NULL;
    ```

---

**Last Updated:** January 2026
