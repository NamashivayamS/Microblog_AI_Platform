import asyncio
from fastapi import APIRouter, Depends, status, Query, BackgroundTasks, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import PostCreate, PostResponse, LikeRequest, LikeResponse, TrendingTag
import crud

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post(
    "/",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new post",
    description=(
        "Create a new microblog post. Content must be 1–280 characters. "
        "Any #hashtags in the content are automatically parsed and indexed."
    ),
)
def create_post(
    post: PostCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    result = crud.create_post(db=db, post=post)
    # Notify ALL connected SSE clients non-blocking
    background_tasks.add_task(crud.notify_clients)
    return result


@router.get(
    "/",
    response_model=List[PostResponse],
    summary="Get all posts",
    description="Retrieve posts ordered newest-first. Supports ETag conditional caching, hashtag filtering, and full-text search.",
)
def get_posts(
    request: Request,
    response: Response,
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = Query(default=None, description="Filter by hashtag (e.g. FastAPI)"),
    search: Optional[str] = Query(default=None, description="Search posts by content or username"),
    db: Session = Depends(get_db),
):
    # ── ETag Conditional Request ─────────────────────────────
    etag = crud.generate_state_hash(db)
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "no-cache"

    if request.headers.get("if-none-match") == f'"{etag}"':
        # Feed hasn't changed — send zero-byte response saving full bandwidth
        return Response(status_code=304)

    return crud.get_posts(db=db, skip=skip, limit=limit, tag=tag, search=search)


@router.post(
    "/{post_id}/like",
    response_model=LikeResponse,
    summary="Like a post",
    description="Like a post. Each user can only like a post once. Returns 409 on duplicate.",
)
def like_post(
    post_id: int,
    like: LikeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    result = crud.like_post(db=db, post_id=post_id, like=like)
    background_tasks.add_task(crud.notify_clients)
    return result


@router.get(
    "/trending-tags",
    response_model=List[TrendingTag],
    summary="Get trending hashtags",
    description="Returns the most used hashtags from the 100 most recent posts.",
    tags=["tags"],
)
def trending_tags(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_trending_tags(db=db, limit=limit)


@router.get(
    "/stream",
    summary="Server-Sent Events stream",
    description=(
        "A persistent SSE connection. The server pushes a 'refresh' event "
        "when posts or likes change. Clients use this instead of polling."
    ),
    tags=["realtime"],
)
async def sse_stream(request: Request):
    """
    True Real-Time feed using Server-Sent Events (SSE).
    Each connected client gets its own asyncio.Queue.
    The server pushes a lightweight 'refresh' signal when data changes.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=10)
    crud.SSE_CLIENTS.append(queue)

    async def event_generator():
        try:
            # Send a heartbeat immediately on connect
            yield "data: connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Wait up to 25s for an event (acts as a keep-alive heartbeat)
                    event = await asyncio.wait_for(queue.get(), timeout=25)
                    yield f"data: {event}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat ping to keep the connection alive
                    yield ": heartbeat\n\n"
        finally:
            crud.SSE_CLIENTS.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
