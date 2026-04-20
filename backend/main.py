from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import posts
from database import engine
import models
import uvicorn

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Social Media Microblog API",
    description=(
        "A Twitter-like microblog API built with FastAPI and SQLite. "
        "Supports creating posts (max 280 chars) and liking posts (once per user)."
    ),
    version="1.0.0",
    contact={
        "name": "Microblog API",
        "email": "dev@microblog.com"
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )


app.include_router(posts.router)


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
