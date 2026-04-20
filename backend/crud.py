import re
import asyncio
import hashlib
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, desc, or_
from fastapi import HTTPException
from cachetools import cached, TTLCache
from models import MicroPost, Like, PostHashtag
from schemas import PostCreate, LikeRequest


# ── Real-Time SSE Infrastructure ─────────────────────────────
SSE_CLIENTS = []

async def notify_clients():
    """To be called via BackgroundTasks when a mutation happens."""
    for q in SSE_CLIENTS:
        try:
            q.put_nowait("update")
        except asyncio.QueueFull:
            pass

def generate_state_hash(db: Session) -> str:
    """Calculates an ETag representing global logical feed state."""
    # A fast aggregation to check if state changed without full query
    res = db.query(
        func.max(MicroPost.id).label("max_id"),
        func.count(MicroPost.id).label("total_posts"),
        func.count(Like.id).label("total_likes")
    ).first()
    raw = f"{res.max_id}-{res.total_posts}-{res.total_likes}"
    return hashlib.md5(raw.encode()).hexdigest()

# ── Internal helpers ─────────────────────────────────────────

HASHTAG_RE = re.compile(r'#([A-Za-z][A-Za-z0-9_]{0,49})')


def _extract_tags(content: str) -> list[str]:
    """Return list of unique lowercase tags found in content."""
    return list({m.lower() for m in HASHTAG_RE.findall(content)})


def _post_to_dict(db: Session, post: MicroPost) -> dict:
    likes_count = db.query(Like).filter(Like.post_id == post.id).count()
    tags = [ph.tag for ph in db.query(PostHashtag).filter(PostHashtag.post_id == post.id).all()]
    return {
        "id": post.id,
        "content": post.content,
        "user_name": post.user_name,
        "created_at": post.created_at,
        "likes_count": likes_count,
        "tags": tags,
    }


# ── CRUD Operations ──────────────────────────────────────────

def create_post(db: Session, post: PostCreate) -> dict:
    db_post = MicroPost(content=post.content, user_name=post.user_name)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # Parse and store hashtags
    tags = _extract_tags(post.content)
    for tag in tags:
        db.add(PostHashtag(post_id=db_post.id, tag=tag))
    if tags:
        db.commit()

    return _post_to_dict(db, db_post)


def get_posts(db: Session, skip: int = 0, limit: int = 100, tag: str | None = None, search: str | None = None) -> list[dict]:
    query = db.query(MicroPost)

    if tag:
        # Filter: only posts that have this hashtag
        clean_tag = tag.lstrip('#').lower()
        query = query.join(PostHashtag).filter(PostHashtag.tag == clean_tag)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MicroPost.content.ilike(search_term),
                MicroPost.user_name.ilike(search_term)
            )
        )

    posts = query.order_by(MicroPost.id.desc()).offset(skip).limit(limit).all()
    return [_post_to_dict(db, p) for p in posts]


def get_post_by_id(db: Session, post_id: int) -> MicroPost:
    post = db.query(MicroPost).filter(MicroPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def like_post(db: Session, post_id: int, like: LikeRequest) -> dict:
    post = db.query(MicroPost).filter(MicroPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_name == like.user_name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already liked this post")

    db_like = Like(post_id=post_id, user_name=like.user_name)
    try:
        db.add(db_like)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You already liked this post")

    total_likes = db.query(Like).filter(Like.post_id == post_id).count()
    return {"message": "Post liked successfully", "total_likes": total_likes}


# Cache trending tags for 5 seconds to prevent DB overload. Key on limit to ignore the DB session.
@cached(cache=TTLCache(maxsize=1, ttl=5), key=lambda db, limit=10: limit)
def get_trending_tags(db: Session, limit: int = 10) -> list[dict]:
    """
    Return the most used hashtags across the 100 most recent posts.
    Groups by tag, counts occurrences, orders by count desc.
    """
    # Sub-select the most recent 100 post IDs
    recent_ids = (
        db.query(MicroPost.id)
        .order_by(MicroPost.id.desc())
        .limit(100)
        .subquery()
    )

    rows = (
        db.query(PostHashtag.tag, func.count(PostHashtag.id).label("count"))
        .filter(PostHashtag.post_id.in_(recent_ids))
        .group_by(PostHashtag.tag)
        .order_by(desc("count"))
        .limit(limit)
        .all()
    )

    return [{"tag": row.tag, "count": row.count} for row in rows]
