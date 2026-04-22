import React, { useState, useEffect } from 'react';
import { likePost, createComment } from '../api';
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

function LiveTimeAgo({ dateStr }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    // Re-render every 15 seconds to keep relative time accurate without fetching
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);
  return <span className="post-timestamp">{timeAgo(dateStr)}</span>;
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

  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commenting, setCommenting] = useState(false);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!userName) return;
    if (!commentContent.trim()) return;

    setCommenting(true);
    try {
      await createComment(post.id, commentContent, userName);
      setCommentContent('');
      // No re-fetch needed! SSE will push the update to all clients automatically!
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setCommenting(false);
    }
  };

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

  const getFallbackName = (username) => {
    if (!username) return 'Anonymous';
    // Strip email domain and any numbers
    let base = username.split('@')[0].replace(/[0-9]/g, '');
    if (!base) base = username.split('@')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const displayName = post.author_name 
    ? post.author_name 
    : getFallbackName(post.user_name);

  return (
    <article className="post-card">
      <Avatar name={displayName} size={40} />
      <div className="post-right">
        {/* Header */}
        <div className="post-header">
          <span className="post-display-name">{displayName}</span>
          <span className="post-handle">@{post.user_name}</span>
          <span className="post-dot">·</span>
          <LiveTimeAgo dateStr={post.created_at} />
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
        <div className="post-actions" style={{ justifyContent: 'space-around', width: '100%' }}>
          {/* Reply */}
          <button 
            className="action-btn" 
            title="Reply"
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          >
            <span className="action-icon">💬</span>
            <span className="action-count">{post.comments?.length || 0}</span>
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

          {/* Share */}
          <button 
            className="action-btn" 
            title="Share"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: `Post by ${displayName}`,
                    text: post.content,
                  });
                } else {
                  await navigator.clipboard.writeText(post.content);
                  alert("Post text copied to clipboard!");
                }
              } catch (err) {
                // Ignore DOMException errors (like user cancellation)
              }
            }}
          >
            <span className="action-icon">↗</span>
          </button>
        </div>

        {/* Nested Comments Section */}
        {showComments && (
          <div className="comments-section" onClick={(e) => e.stopPropagation()}>
            <div className="comments-list">
              {(post.comments || []).map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{comment.author_name || getFallbackName(comment.user_name)}</strong>
                    <span className="comment-handle">@{comment.user_name}</span>
                    <span className="comment-dot">·</span>
                    <LiveTimeAgo dateStr={comment.created_at} />
                  </div>
                  <div className="comment-content">{comment.content}</div>
                </div>
              ))}
            </div>
            
            {userName ? (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Post your reply"
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  disabled={commenting}
                />
                <button type="submit" disabled={!commentContent.trim() || commenting}>
                  Reply
                </button>
              </form>
            ) : (
              <div style={{ fontSize: '13px', color: 'gray', padding: '10px 0', textAlign: 'center' }}>
                Log in to join the conversation.
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
