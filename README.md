# Hintro Backend API

AI-powered Meeting Intelligence Platform. Node.js + Express + MongoDB + Gemini AI.

## Quick Start

```bash
cp .env.example .env   # fill in your values
npm install
npm run dev            # starts on http://localhost:5000
```

API docs: http://localhost:5000/api-docs  
Health: http://localhost:5000/health

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default 5000 |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 chars |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `AI_PROVIDER` | No | `gemini` or `openai` (default: `openai`) |
| `TELEGRAM_BOT_TOKEN` | No | For Telegram reminders |
| `CLIENT_URL` | No | CORS origin (default: http://localhost:5173) |

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout |
| GET | `/me` | Current user profile |
| PATCH | `/change-password` | Change password |

### Meetings (`/api/v1/meetings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List meetings (paginated, filterable) |
| POST | `/` | Create meeting |
| GET | `/:id` | Get meeting by ID |
| PATCH | `/:id` | Update meeting |
| DELETE | `/:id` | Delete meeting |
| POST | `/:id/analyze` | Full AI analysis (summary + actions + insights) |

### Transcripts (`/api/v1/transcripts`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/:meetingId` | Upload/replace transcript |
| GET | `/:meetingId` | Get transcript |

### Action Items (`/api/v1/action-items`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/overdue` | All overdue items |
| GET | `/` | List (filter by status/meetingId/assignee) |
| POST | `/` | Create action item |
| PATCH | `/:id/status` | Update status |

### AI Analysis (`/api/v1/ai`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/meetings/:meetingId/summarize` | Generate summary |
| POST | `/meetings/:meetingId/extract-actions` | Extract action items |
| POST | `/meetings/:meetingId/insights` | Generate insights |
| POST | `/meetings/:meetingId/analyze` | Run all three |

### Notifications (`/api/v1/notifications`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark as read |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/evaluation` | Platform metrics |
| GET | `/api-docs` | Swagger UI |

## Running Tests

```bash
npm test                 # all tests
npm run test:unit        # unit tests only
npm run test:integration # integration tests only
npm run test:coverage    # with coverage report
```

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Meeting Reminders | Every 15 min | Sends reminders for upcoming meetings |
| Overdue Detection | Every 15 min | Flags overdue action items + Telegram alerts |

## Architecture

```
src/
├── api/v1/          # Feature modules (controller/service/repository/validator/routes)
│   ├── auth/
│   ├── meetings/
│   ├── transcripts/
│   ├── action-items/
│   ├── ai/
│   ├── notifications/
│   └── evaluation/
├── config/          # App/auth/AI/swagger configuration
├── integrations/    # AI factory, Telegram, Slack clients
├── jobs/            # node-cron scheduled jobs
├── middleware/       # auth, error, rate limiter, trace ID, validate
├── models/          # Mongoose schemas
└── utils/           # ApiError, ApiResponse, asyncHandler, logger, pagination
```
