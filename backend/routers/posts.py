from fastapi import APIRouter, Depends, status, Query
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
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    return crud.create_post(db=db, post=post)


@router.get(
    "/",
    response_model=List[PostResponse],
    summary="Get all posts",
    description="Retrieve posts ordered newest-first. Optionally filter by #hashtag via ?tag=",
)
def get_posts(
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = Query(default=None, description="Filter by hashtag (e.g. FastAPI)"),
    search: Optional[str] = Query(default=None, description="Search posts by content or username"),
    db: Session = Depends(get_db),
):
    return crud.get_posts(db=db, skip=skip, limit=limit, tag=tag, search=search)


@router.post(
    "/{post_id}/like",
    response_model=LikeResponse,
    summary="Like a post",
    description="Like a post. Each user can only like a post once. Returns 409 on duplicate.",
)
def like_post(post_id: int, like: LikeRequest, db: Session = Depends(get_db)):
    return crud.like_post(db=db, post_id=post_id, like=like)


@router.get(
    "/trending-tags",
    response_model=List[TrendingTag],
    summary="Get trending hashtags",
    description="Returns the most used hashtags from the 100 most recent posts.",
    tags=["tags"],
)
def trending_tags(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_trending_tags(db=db, limit=limit)
