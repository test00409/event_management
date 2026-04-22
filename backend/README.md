# Event Staffing Platform — Backend API

Production-ready two-sided event staffing platform. Node.js + Express + MySQL + Redis.

---

## Architecture

```
src/
├── config/           # DB + Redis connections
├── database/
│   ├── models/       # Sequelize models + associations
│   └── seeder.js     # Seed data (super admin, demo admin/worker/event)
├── middleware/        # auth, errorHandler, validate, upload
├── modules/           # Feature modules (each: service + routes)
│   ├── auth/
│   ├── admin/
│   ├── events/
│   ├── applications/
│   ├── chats/
│   ├── tasks/
│   ├── attendance/
│   ├── payments/
│   ├── ratings/
│   ├── user/
│   ├── talent/
│   ├── analytics/
│   └── superadmin/
├── queues/            # BullMQ (notifications + T+1 payments)
├── utils/             # logger, jwt, otp, AppError, response, constants
├── validators/        # Joi schemas
└── app.js             # Express app
server.js              # Entry point
```

---

## Setup

### Prerequisites
- Node.js ≥ 18
- MySQL 8+
- Redis (optional — falls back to in-memory if unavailable)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Create MySQL database
```sql
CREATE DATABASE event_staffing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

On first start, Sequelize auto-creates all tables and seeds:
- **Super Admin** → phone: `9999999999`
- **Demo Admin**  → phone: `8888888888` (pre-verified)
- **Demo Worker** → phone: `7777777777`
- **Demo Event**  → "Annual Tech Conference 2025"

**OTP appears in your terminal/log — no SMS gateway needed in dev.**

---

## API Overview

Base URL: `http://localhost:3000/api/v1`

### Roles & Access
| Role        | Capabilities |
|-------------|-------------|
| SUPER_ADMIN | Full access to all data |
| ADMIN       | Own events, applications, workers only |
| USER        | Own profile, applications, jobs |

### Authentication Flow
```
POST /auth/send-otp     { phone }
POST /auth/verify-otp   { phone, otp, name? }
→ returns { accessToken, refreshToken }

POST /auth/refresh      { refresh_token }
POST /auth/logout       [Bearer token]
```

Admin auth uses `/auth/admin/send-otp` and `/auth/admin/verify-otp`.

---

## Key Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-otp` | — | Send OTP (Worker/SA) |
| POST | `/auth/verify-otp` | — | Verify OTP & login |
| POST | `/auth/admin/send-otp` | — | Send OTP (Admin) |
| POST | `/auth/admin/verify-otp` | — | Admin login |
| POST | `/auth/refresh` | — | Refresh tokens |
| POST | `/auth/logout` | ✓ | Logout |

### Admin Profile
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/signup` | ADMIN | Submit profile + proof doc |
| GET | `/admin/profile` | ADMIN | Get own profile |
| GET | `/admin/verification-status` | ADMIN | Check verification status |

### Events (Admin)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/events` | ADMIN | Create event (DRAFT) |
| GET | `/events` | ADMIN | List own events |
| GET | `/events/:id` | ADMIN | Get event detail |
| PATCH | `/events/:id` | ADMIN | Update event |
| DELETE | `/events/:id` | ADMIN | Soft delete |
| PATCH | `/events/:id/publish` | ADMIN | DRAFT → PUBLISHED |
| PATCH | `/events/:id/complete` | ADMIN | Mark done + queue payments |
| GET | `/events/:id/report` | ADMIN | JSON event report |
| POST | `/events/:id/roles` | ADMIN | Add role |
| GET | `/events/:id/roles` | ADMIN | List roles |
| GET | `/events/:id/applications` | ADMIN | Review applicants |
| GET | `/events/:id/tasks` | ADMIN | Event tasks |
| GET | `/events/:id/attendance` | ADMIN | Attendance records |

### Jobs (Worker)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs` | ✓ | Browse published events |
| GET | `/jobs/recommended` | USER | AI-matched recommendations |
| GET | `/jobs/:id` | — | Event details |

### Applications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/applications` | USER | Apply for role |
| GET | `/applications/my` | USER | My applications |
| GET | `/applications/:id` | ✓ | Get application |
| PATCH | `/applications/:id/status` | ADMIN | Accept / Reject |

### Chat
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chats/start` | ADMIN | Start chat (after hire) |
| GET | `/chats/my` | ✓ | My chat list |
| GET | `/chats/:id/messages` | ✓ | Get messages |
| POST | `/chats/messages` | ✓ | Send message |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tasks` | ADMIN | Assign task |
| GET | `/tasks/my` | USER | My tasks |
| PATCH | `/tasks/:id/status` | ✓ | Update status |

### Attendance
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/attendance/qr/:eventId` | ADMIN | Generate QR token |
| POST | `/attendance/check-in` | USER | QR or manual check-in |
| POST | `/attendance/check-out` | USER | Check out |

### Payments & Wallet
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/release` | ADMIN | Trigger T+1 payment |
| GET | `/payments/wallet` | USER | Wallet balance |
| POST | `/payments/wallet/withdraw` | USER | Withdraw funds |
| GET | `/earnings` | USER | Transaction history |

### Ratings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ratings` | ADMIN/USER | Submit mutual rating |
| GET | `/ratings/user/:userId` | ✓ | Get user ratings |

### Talent Pool
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/talent/save-worker` | ADMIN | Save to pool |
| GET | `/talent/workers` | ADMIN | My talent pool |
| DELETE | `/talent/workers/:userId` | ADMIN | Remove from pool |

### Issues
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/issues/replace-worker` | ADMIN | Replace worker + log issue |
| GET | `/issues/event/:eventId` | ADMIN | Event issues |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/dashboard` | ADMIN | Cost, fill rate, ratings |

### Super Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/super-admin/admins` | SA | All admins |
| PATCH | `/super-admin/admin/:id/verify` | SA | Approve/reject admin |
| GET | `/super-admin/users` | SA | All workers |
| GET | `/super-admin/events` | SA | All events |
| GET | `/super-admin/payments` | SA | All payments |
| PATCH | `/super-admin/block-user` | SA | Block/unblock |
| GET | `/super-admin/analytics` | SA | Platform analytics |

---

## Security Features
- **JWT** access (15m) + refresh (7d) tokens with rotation
- **OTP**: 6-digit, Redis-backed, 5min expiry, rate-limited (3/min), blocked after 5 failures for 30min
- **RBAC**: Every route enforces role guards
- **Data isolation**: Admin can only access their own resources (checked in every service method)
- **Helmet** security headers
- **Global rate limiter**: 200 req/15min
- **Soft deletes** on all major tables
- **SQL injection**: Sequelize ORM parameterized queries
- **Input validation**: Joi on every request body/query

## Payment Flow (T+1)
```
Admin marks event complete
  → All hires marked work_done
  → BullMQ job queued with 24h delay
  → [T+1] Worker wallet credited
  → Transaction logged
  → Push notification sent
```

## OTP Security Flow
```
POST /auth/send-otp
  → Check blocked? → 429
  → Check rate limit (3/min)? → 429
  → Generate 6-digit OTP (crypto.randomInt)
  → Store in Redis with 5min TTL
  → Clear attempt counter
  → Log OTP to console (dev)

POST /auth/verify-otp
  → Check blocked? → 429
  → Fetch OTP from Redis
  → Not found? → 400 (expired)
  → Mismatch? → increment attempts
  → 5 failures → block number 30min → 429
  → Match → delete OTP → issue JWT pair
```

## Postman Testing
1. Import `postman_collection.json`
2. Set collection variable `base_url = http://localhost:3000/api/v1`
3. Run **Send OTP** → check server logs for OTP → run **Verify OTP** (auto-sets token variable)
4. Tokens auto-populate via collection variable test scripts

---

## Database Schema (15 tables)

`users` · `admins` · `events` · `event_roles` · `applications` · `hires` · `tasks` · `attendance` · `chats` · `messages` · `wallets` · `payments` · `transactions` · `ratings` · `talent_pool` · `issues` · `notifications`

All tables include: `created_at`, `updated_at`, `deleted_at` (soft delete), UUID primary keys, proper foreign keys and indexes.
