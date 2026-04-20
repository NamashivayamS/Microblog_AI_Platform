import React, { useState } from 'react';
import { likePost } from '../api';
import { Avatar } from '../App';

function timeAgo(dateStr) {
  const now  = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)     return `${diff}s`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Render post content with clickable #hashtags
function ContentWithTags({ content, onTagClick }) {
  // Split content by hashtag pattern
  const parts = content.split(/(#[A-Za-z][A-Za-z0-9_]*)/g);
  return (
    <p className="post-content">
      {parts.map((part, i) => {
        if (/^#[A-Za-z][A-Za-z0-9_]*$/.test(part)) {
          return (
            <span
              key={i}
              className="hashtag-link"
              onClick={(e) => { e.stopPropagation(); onTagClick(part.slice(1)); }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function PostCard({ post, userName, alreadyLiked, onLiked, onTagClick }) {
  const [likeError, setLikeError]        = useState('');
  const [optimisticLikes, setOptimistic] = useState(null);
  const [localLiked, setLocalLiked]      = useState(alreadyLiked);

  const likesCount = optimisticLikes !== null ? optimisticLikes : post.likes_count;

  const handleLike = async () => {
    if (!userName.trim()) {
      setLikeError('Set your handle first');
      setTimeout(() => setLikeError(''), 2500);
      return;
    }
    if (localLiked) return;

    setOptimistic(likesCount + 1);
    setLocalLiked(true);
    setLikeError('');

    try {
      await likePost(post.id, userName.trim());
      onLiked(post.id);
    } catch (err) {
      setOptimistic(null);
      setLocalLiked(false);
      const msg = err.response?.data?.detail || 'Could not like';
      setLikeError(msg);
      setTimeout(() => setLikeError(''), 3000);
    }
  };

  const displayName = post.user_name
    ? post.user_name.charAt(0).toUpperCase() + post.user_name.slice(1)
    : 'Anonymous';

  // Simulated view count (deterministic from post id)
  const views = post.id * 47 + 12;

  return (
    <article className="post-card">
      <Avatar name={post.user_name} size={40} />
      <div className="post-right">
        {/* Header */}
        <div className="post-header">
          <span className="post-display-name">{displayName}</span>
          <span className="post-handle">@{post.user_name}</span>
          <span className="post-dot">·</span>
          <span className="post-timestamp">{timeAgo(post.created_at)}</span>
        </div>

        {/* Content with clickable hashtags */}
        <ContentWithTags content={post.content} onTagClick={onTagClick} />

        {/* Tags row (pills) */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="tag-pill"
                onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="post-actions">
          {/* Reply */}
          <button className="action-btn" title="Reply">
            <span className="action-icon">💬</span>
            <span className="action-count">0</span>
          </button>
          {/* Repost */}
          <button className="action-btn" title="Repost">
            <span className="action-icon">🔁</span>
            <span className="action-count">0</span>
          </button>
          {/* Like */}
          <div style={{ position: 'relative' }}>
            <button
              className={`action-btn like-action${localLiked ? ' liked' : ''}`}
              onClick={handleLike}
              disabled={localLiked}
              title={localLiked ? 'Already liked' : 'Like'}
            >
              <span className="action-icon">{localLiked ? '❤️' : '🤍'}</span>
              {likesCount > 0 && <span className="action-count">{likesCount}</span>}
            </button>
            {likeError && <div className="like-error-tip">{likeError}</div>}
          </div>
          {/* Views */}
          <button className="action-btn" title="Views">
            <span className="action-icon">📊</span>
            <span className="action-count">{views}</span>
          </button>
          {/* Share */}
          <button className="action-btn" title="Share">
            <span className="action-icon">↗</span>
          </button>
        </div>
      </div>
    </article>
  );
}
