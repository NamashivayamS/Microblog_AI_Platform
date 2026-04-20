import React, { useState } from 'react';
import { createPost } from '../api';

const MAX_CHARS = 280;

export default function CreatePost({ userName, onPostCreated }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;
  const canSubmit = !isEmpty && !isOverLimit && !submitting && userName.trim();

  const counterClass = remaining <= 0
    ? 'over'
    : remaining <= 20
    ? 'warning'
    : '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await createPost(content, userName.trim());
      setContent('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onPostCreated();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to post. Try again.';
      setError(Array.isArray(msg) ? msg[0]?.msg || String(msg) : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="create-card">
      <h2>new post</h2>

      {!userName.trim() && (
        <p className="no-user-hint">Set your handle in the top-right to post</p>
      )}

      <textarea
        className={`post-textarea${isOverLimit ? ' over-limit' : ''}`}
        placeholder="What's on your mind? (Ctrl+Enter to post)"
        value={content}
        onChange={e => { setContent(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        disabled={submitting || !userName.trim()}
        rows={4}
      />

      <div className="create-footer">
        <span className={`char-counter ${counterClass}`}>
          {remaining < 50 ? `${remaining} left` : `${content.length} / ${MAX_CHARS}`}
        </span>
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>

      {error && <div className="create-error">{error}</div>}
      {success && <div className="create-success">Posted successfully!</div>}
    </div>
  );
}
