# Microblog — Social Media Microblog

A Twitter-like microblogging system built with **FastAPI**, **SQLite**, **ReactJS**, and an **auto-generated Python SDK** via OpenAPI Generator CLI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.111, Python 3.10+ |
| Database | SQLite + SQLAlchemy ORM + Alembic |
| Frontend | ReactJS 18, Axios |
| SDK | Auto-generated via OpenAPI Generator CLI |
| Tests | pytest + httpx (23 test cases) |

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Java 11+ (for OpenAPI Generator CLI — SDK generation only)
- [Optional] sqlite3 CLI (for seeding sample data)

---

## Quick Start (Windows)

```bat
REM 1. Setup the entire environment
setupdev.bat

REM 2. Start both servers
runapplication.bat
```

Then open http://localhost:3000 in your browser.

---

## Manual Setup

### Backend

```bash
# Create and activate virtualenv
python -m venv env
env\Scripts\activate          # Windows
# source env/bin/activate     # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
cd backend
alembic upgrade head

# (Optional) Seed sample data
sqlite3 microblog.db < seed_data.sql

# Start the backend
uvicorn main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**  
Swagger UI at **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000**

---

## API Reference

| Method | Endpoint | Description | Success | Error |
|---|---|---|---|---|
| `POST` | `/posts/` | Create a post (max 280 chars) | `201` | `422` |
| `GET` | `/posts/` | Get all posts with like counts | `200` | — |
| `POST` | `/posts/{id}/like` | Like a post (once per user) | `200` | `404`, `409` |
| `GET` | `/docs` | Swagger UI | `200` | — |
| `GET` | `/health` | Health check | `200` | — |

### Trick Logic (enforced rules)

1. **280-character limit** — posts exceeding 280 characters are rejected with HTTP `422`
2. **No duplicate likes** — the same user liking the same post twice returns HTTP `409`

Both rules are enforced at two levels: Pydantic validation + database `UNIQUE` constraint.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Expected output: **23 passed**

Test coverage includes:
- Creating posts (success, 280-char boundary, 281-char rejection, empty, whitespace-only)
- Getting posts (empty feed, list format, newest-first order, likes_count field)
- Liking posts (success, count increment, duplicate rejection, 404, invalid params)
- Different users liking same post (valid — must succeed)
- Health endpoints

---

## SDK Generation

The Python SDK is **auto-generated** from the live OpenAPI spec — do not hand-code it.

### Step 1: Install OpenAPI Generator CLI

```bash
npm install -g @openapitools/openapi-generator-cli
```

### Step 2: Ensure backend is running

```bash
cd backend && uvicorn main:app --reload --port 8000
```

### Step 3: Generate the SDK

```bash
openapi-generator-cli generate \
    -i http://localhost:8000/openapi.json \
    -g python \
    -o microblog_sdk
```

### Step 4: Install the SDK

```bash
cd microblog_sdk
pip install -e .
cd ..
```

### Step 5: Run the SDK demo

```bash
python sdk_demo.py
```

### SDK Usage Example

```python
from microblog_sdk.api.posts_api import PostsApi
from microblog_sdk import ApiClient, Configuration
from microblog_sdk.models.post_create import PostCreate
from microblog_sdk.models.like_request import LikeRequest

config = Configuration(host="http://localhost:8000")
client = ApiClient(configuration=config)
api = PostsApi(client)

# Get all posts
posts = api.get_posts_posts_get()
print(posts)

# Create a post
new_post = api.create_post_posts_post(
    PostCreate(content="Hello via SDK!", user_name="sdk_user")
)

# Like a post
result = api.like_post_posts_post_id_like_post(
    post_id=new_post.id,
    like_request=LikeRequest(user_name="another_user")
)
```

---

## Project Structure

```
microblog/
├── backend/
│   ├── main.py              # FastAPI app, CORS, global error handler
│   ├── database.py          # SQLAlchemy engine + session + get_db()
│   ├── models.py            # ORM: MicroPost, Like (with UNIQUE constraint)
│   ├── schemas.py           # Pydantic v2 request/response schemas
│   ├── crud.py              # DB operations (trick logic enforced here)
│   ├── routers/posts.py     # Route handlers
│   ├── alembic/             # Migration files
│   ├── tests/
│   │   ├── conftest.py      # In-memory SQLite test DB
│   │   └── test_posts.py    # 23 test cases
│   ├── seed_data.sql        # Sample posts and likes
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx          # Root: state, polling, layout
│       ├── App.css          # Full design system
│       ├── api.js           # Axios calls (single source of truth)
│       └── components/
│           ├── CreatePost.jsx  # Form, char counter, validation
│           ├── PostCard.jsx    # Post with optimistic like update
│           └── PostList.jsx    # Feed renderer
├── microblog_sdk/           # Auto-generated (do not edit)
├── sdk_demo.py              # SDK smoke-test script
├── setupdev.bat             # Full environment setup
├── runapplication.bat       # Starts backend + frontend
└── README.md
```

---

## Design Decisions

- **UNIQUE constraint at DB level** — `UNIQUE(post_id, user_name)` in the `likes` table provides a second safety net beyond the application-level check, guarding against race conditions.
- **In-memory test DB** — `StaticPool` SQLite in pytest ensures test isolation with zero side effects on `microblog.db`.
- **Order by ID DESC** — Posts are ordered by `id` (not `created_at`) to guarantee stable ordering when multiple posts are inserted within the same second, which SQLite's 1-second timestamp resolution would otherwise make non-deterministic.
- **Computed `likes_count`** — The count is computed via a live SQL query on every request rather than stored as a column, preventing count drift if records are deleted.
- **Polling every 5 seconds** — Provides real-time-like updates without requiring WebSockets, keeping the stack simple.
