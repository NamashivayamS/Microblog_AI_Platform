import React from 'react';
import PostCard from './PostCard';

export default function PostList({ posts, userName, likedPosts, onLiked, onTagClick }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="empty-feed">
        <span className="empty-feed-icon">✨</span>
        <h3>Welcome to microblog</h3>
        <p>Be the first to post something. Try using #hashtags to categorise your thoughts!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          userName={userName}
          alreadyLiked={likedPosts.includes(post.id)}
          onLiked={onLiked}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
