import re
import asyncio
import hashlib
import bcrypt
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, desc, or_
from fastapi import HTTPException
from cachetools import cached, TTLCache
from models import MicroPost, Like, PostHashtag, User, Comment
from schemas import PostCreate, LikeRequest, UserCreate, UserLogin, CommentCreate


# ── Real-Time SSE Infrastructure ─────────────────────────────
SSE_CLIENTS = []

async def notify_clients():
    """
    To be called via BackgroundTasks when a mutation happens.
    Pushes a lightweight 'update' string to all connected SSE clients.
    """
    for q in SSE_CLIENTS:
        try:
            q.put_nowait("update")
        except asyncio.QueueFull:
            pass

def generate_state_hash(db: Session) -> str:
    """Calculates an ETag representing global logical feed state.
    We hash the max post ID, and counts of posts, likes, and comments. 
    If this hash hasn't changed, the client can safely use their cached feed!"""
    max_id = db.query(func.max(MicroPost.id)).scalar() or 0
    total_posts = db.query(func.count(MicroPost.id)).scalar() or 0
    total_likes = db.query(func.count(Like.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    raw = f"{max_id}-{total_posts}-{total_likes}-{total_comments}"
    return hashlib.md5(raw.encode()).hexdigest()

# ── Internal helpers ─────────────────────────────────────────

# Regex to safely pluck out alphanumeric hashtags (max 50 chars)
HASHTAG_RE = re.compile(r'#([A-Za-z][A-Za-z0-9_]{0,49})')


def _extract_tags(content: str) -> list[str]:
    """Return list of unique lowercase tags found in content."""
    return list({m.lower() for m in HASHTAG_RE.findall(content)})


def _post_to_dict(db: Session, post: MicroPost) -> dict:
    """
    Central serializer. 
    Maps the MicroPost model into our Pydantic PostResponse format, 
    fetching aggregate likes and resolving real display names.
    """
    likes_count = db.query(Like).filter(Like.post_id == post.id).count()
    tags = [ph.tag for ph in db.query(PostHashtag).filter(PostHashtag.post_id == post.id).all()]
    author_name = None
    
    # Try looking up the actual display name of the user
    user = db.query(User).filter(User.username == post.user_name).first()
    if user:
        author_name = user.name

    # Fetch and serialize nested comments
    db_comments = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.id.asc()).all()
    comments = []
    for c in db_comments:
        c_author_name = None
        c_user = db.query(User).filter(User.username == c.user_name).first()
        if c_user:
            c_author_name = c_user.name
        comments.append({
            "id": c.id,
            "post_id": c.post_id,
            "content": c.content,
            "user_name": c.user_name,
            "author_name": c_author_name,
            "created_at": c.created_at
        })

    return {
        "id": post.id,
        "content": post.content,
        "user_name": post.user_name,
        "author_name": author_name,
        "created_at": post.created_at,
        "likes_count": likes_count,
        "tags": tags,
        "comments": comments,
    }


# ── CRUD Operations ──────────────────────────────────────────

def create_post(db: Session, post: PostCreate) -> dict:
    # 1. Insert the main post record
    db_post = MicroPost(content=post.content, user_name=post.user_name)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # 2. Parse and store any hashtags associated with it
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

# ── User Operations ──────────────────────────────────────────

def create_user(db: Session, user: UserCreate) -> User:
    # Check if username exists
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash password securely
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(user.password.encode("utf-8"), salt).decode("utf-8")

    db_user = User(
        name=user.name,
        username=user.username,
        hashed_password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, user: UserLogin) -> User:
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not bcrypt.checkpw(user.password.encode("utf-8"), db_user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return db_user

def create_comment(db: Session, post_id: int, comment: CommentCreate) -> dict:
    post = db.query(MicroPost).filter(MicroPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db_comment = Comment(
        post_id=post_id,
        user_name=comment.user_name,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # Return the updated post object which includes the new comment
    return _post_to_dict(db, post)
