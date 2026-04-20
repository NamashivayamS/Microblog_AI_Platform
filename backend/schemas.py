from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
import re


class PostCreate(BaseModel):
    content: str
    user_name: str

    @field_validator("content")
    @classmethod
    def content_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Post content cannot be empty")
        if len(v) > 280:
            raise ValueError("Post content exceeds 280 characters")
        return v

    @field_validator("user_name")
    @classmethod
    def username_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("user_name cannot be empty")
        return v.strip()


class PostResponse(BaseModel):
    id: int
    content: str
    user_name: str
    created_at: datetime
    likes_count: int
    tags: List[str] = []      # ← hashtags extracted from content

    model_config = {"from_attributes": True}


class LikeRequest(BaseModel):
    user_name: str

    @field_validator("user_name")
    @classmethod
    def username_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("user_name cannot be empty")
        return v.strip()


class LikeResponse(BaseModel):
    message: str
    total_likes: int


class TrendingTag(BaseModel):
    tag: str
    count: int


class ErrorResponse(BaseModel):
    detail: str
