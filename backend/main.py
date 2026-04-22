from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter
from routers import posts, auth
from database import engine
import models
import uvicorn

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Social Media Microblog API",
    description=(
        "A Twitter-like microblog API built with FastAPI and SQLite. "
        "Supports creating posts (max 280 chars) and liking posts (once per user). "
        "Includes real-time SSE feed, ETag conditional caching, and per-IP rate limiting."
    ),
    version="1.0.0",
    contact={
        "name": "Microblog API",
        "email": "dev@microblog.com"
    }
)

# Attach limiter to app state so @limiter.limit decorators can find it
app.state.limiter = limiter

# Register the 429 handler — returns clean JSON instead of an HTML block
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure Cross-Origin Resource Sharing (CORS) for local React app testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    # Allow ETag headers so we can perform smart client-side caching
    allow_headers=["*", "ETag", "If-None-Match"],
)

# Catch-all exception handler to gracefully catch unexpected errors during production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

# Pass limiter into posts router so it can decorate endpoints
posts.router.limiter = limiter
# Mount our modular routers
app.include_router(posts.router)
app.include_router(auth.router)

# Basic root endpoint mapping to direct users to Swagger documentation
@app.get("/", tags=["health"])
def root():
    return {
        "status": "running",
        "message": "Microblog API is live",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
