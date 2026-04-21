from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MicroPost(Base):
    __tablename__ = "micro_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    hashtags = relationship("PostHashtag", back_populates="post", cascade="all, delete-orphan")


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("micro_posts.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String, nullable=False)

    post = relationship("MicroPost", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("post_id", "user_name", name="uq_like_post_user"),
    )


class PostHashtag(Base):
    """Stores parsed hashtags per post — enables fast tag filtering & trending."""
    __tablename__ = "post_hashtags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("micro_posts.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String, nullable=False)  # stored lowercase, no leading #

    post = relationship("MicroPost", back_populates="hashtags")

    __table_args__ = (
        UniqueConstraint("post_id", "tag", name="uq_post_tag"),
        Index("ix_post_hashtags_tag", "tag"),
    )
