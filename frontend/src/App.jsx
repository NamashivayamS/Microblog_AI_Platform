import React, { useState, useEffect, useCallback, useRef } from 'react';
import PostList from './components/PostList';
import EngagementChart from './components/EngagementChart';
import HashtagDropdown from './components/HashtagDropdown';
import { getPosts, getTrending } from './api';
import './App.css';

/* ── Avatar colour helper ─────────────────────────────────── */
const AVATAR_COLORS = ['#1d9bf0','#ff7a00','#f91880','#00ba7c','#794bc4','#ff6f61','#ffd400','#17becf'];
export function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ name = '?', size = 40 }) {
  const initials = name.trim() ? name.trim().slice(0, 2).toUpperCase() : '??';
  return (
    <div
      className={`avatar size-${size}`}
      style={{ background: avatarColor(name) }}
      title={`@${name}`}
    >
      {initials}
    </div>
  );
}

/* ── Character-count ring ─────────────────────────────────── */
function CharRing({ value, max }) {
  const R    = 12;
  const CIRC = 2 * Math.PI * R;
  const pct  = Math.min(value / max, 1);
  const offset = CIRC * (1 - pct);
  const remaining = max - value;
  const isDanger  = remaining < 0;
  const isWarning = !isDanger && remaining <= 20;
  const cls = isDanger ? 'danger' : isWarning ? 'warning' : '';
  if (value === 0) return null;
  return (
    <div className="char-ring-wrap">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle className="char-ring-track" cx="16" cy="16" r={R} />
        <circle
          className={`char-ring-fill ${cls}`}
          cx="16" cy="16" r={R}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      {remaining <= 20 && (
        <span className={`char-ring-count ${cls}`}>{remaining}</span>
      )}
    </div>
  );
}

/* ── Compose box with hashtag autocomplete ────────────────── */
function ComposeBox({ userName, onPostCreated, liveTags }) {
  const [content, setContent]       = useState('');
  const [submitting, setSubmit]     = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  // Hashtag autocomplete state
  const [tagQuery, setTagQuery]     = useState('');   // partial tag being typed
  const [showDropdown, setShow]     = useState(false);
  const [activeSuggIdx, setActIdx]  = useState(0);   // keyboard highlight
  const textareaRef                 = useRef(null);

  const MAX       = 280;
  const remaining = MAX - content.length;
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !submitting && userName.trim();
  const { createPost } = require('./api');

  // ── Detect #partial as user types ──────────────────────────
  const detectHashtag = (val, cursorPos) => {
    // Find the start of the word at cursor
    const beforeCursor = val.slice(0, cursorPos);
    const match = beforeCursor.match(/#([A-Za-z0-9_]*)$/);
    if (match) {
      setTagQuery(match[1]); // could be empty for just "#"
      setShow(true);
      setActIdx(0);
    } else {
      setShow(false);
      setTagQuery('');
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setError('');
    detectHashtag(val, e.target.selectionStart);
  };

  // ── Insert selected tag into textarea ──────────────────────
  const insertTag = (tag) => {
    const cursor    = textareaRef.current?.selectionStart ?? content.length;
    const before    = content.slice(0, cursor);
    const after     = content.slice(cursor);
    // Replace the partial #word at the end of `before` with full tag
    const replaced  = before.replace(/#([A-Za-z0-9_]*)$/, `#${tag}`);
    const newContent = replaced + (after.startsWith(' ') || after === '' ? '' : ' ') + after;
    setContent(newContent.trimEnd() + ' ');
    setShow(false);
    setTagQuery('');
    // Refocus textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // ── Build current filtered suggestions for keyboard nav ────
  const { PRESET_TAGS } = require('./components/HashtagDropdown');
  const liveSet   = new Set(liveTags.map(t => t.tag));
  const allTags   = [
    ...liveTags.map(t => ({ tag: t.tag, live: true })),
    ...PRESET_TAGS.filter(t => !liveSet.has(t)).map(t => ({ tag: t, live: false })),
  ];
  const q = tagQuery.toLowerCase();
  const filteredTags = q.length === 0
    ? allTags.slice(0, 10)
    : allTags.filter(t => t.tag.startsWith(q)).slice(0, 8);

  // ── Keyboard navigation in dropdown ────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { handleSubmit(); return; }
    if (!showDropdown || filteredTags.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActIdx(i => Math.min(i + 1, filteredTags.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertTag(filteredTags[activeSuggIdx].tag);
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmit(true); setError(''); setSuccess(false); setShow(false);
    try {
      await createPost(content.trim(), userName.trim());
      setContent('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onPostCreated();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to post. Try again.';
      setError(Array.isArray(msg) ? msg[0]?.msg || String(msg) : String(msg));
    } finally { setSubmit(false); }
  };

  return (
    <>
      {error   && <div className="compose-error">⚠ {error}</div>}
      {success && <div className="compose-success-toast">✓ Post published!</div>}
      <div className="compose-box">
        <div className="compose-avatar">
          <Avatar name={userName || 'you'} size={40} />
        </div>
        <div className="compose-right" style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="compose-textarea"
            placeholder="What's happening? Use #hashtags to categorise!"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            rows={3}
          />

          {/* ── Hashtag Autocomplete Dropdown ─────────── */}
          {showDropdown && filteredTags.length > 0 && (
            <HashtagDropdown
              query={tagQuery}
              liveTags={liveTags}
              activeIndex={activeSuggIdx}
              onSelect={insertTag}
              onClose={() => setShow(false)}
            />
          )}

          <div className="compose-toolbar">
            <div className="compose-tools">
              {['🖼️','📊','😀','📅','📍'].map(icon => (
                <button key={icon} className="compose-tool-btn" title={icon}>{icon}</button>
              ))}
            </div>
            <div className="compose-actions">
              <CharRing value={content.length} max={MAX} />
              {content.length > 0 && <div className="compose-divider" />}
              <button className="tweet-btn" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Left Navigation ──────────────────────────────────────── */
function LeftNav({ userName, onUserNameChange, activeTab, onNavClick }) {
  return (
    <nav className="left-nav">
      <div className="nav-logo">
        <div className="nav-logo-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.265 5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
        <span className="nav-logo-text">microblog</span>
      </div>
      <div className="nav-items">
        {[
          { icon: '🏠', label: 'Home',         id: 'home'  },
          { icon: '🔍', label: 'Explore',       id: 'explore' },
          { icon: '🔔', label: 'Notifications', id: 'notifications' },
          { icon: '✉️', label: 'Messages',      id: 'messages' },
          { icon: '🔖', label: 'Bookmarks',     id: 'bookmarks' },
          { icon: '👤', label: 'Profile',       id: 'profile' },
        ].map(({ icon, label, id }) => (
          <div
            key={label}
            className={`nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => onNavClick(id)}
          >
            <span className="nav-item-icon">{icon}</span>
            <span className="nav-item-label">{label}</span>
          </div>
        ))}
      </div>
      <button className="post-nav-btn">Post</button>
      <div className="nav-profile" style={{ marginTop: 16 }}>
        <Avatar name={userName || 'you'} size={40} />
        <div className="nav-profile-info">
          <div className="nav-profile-name">
            {userName ? `@${userName}` : 'Set your handle'}
          </div>
          <input
            className="nav-handle-input"
            placeholder="your handle…"
            value={userName}
            onChange={e => onUserNameChange(e.target.value)}
            maxLength={30}
          />
        </div>
      </div>
    </nav>
  );
}


/* ── Right Sidebar ────────────────────────────────────────── */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function RightAside({ posts, trending, activeTag, onTagClick, searchQuery, onSearch }) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const debouncedSearch = useDebounce(localSearch, 300);

  const totalLikes   = posts.reduce((s, p) => s + p.likes_count, 0);
  const totalAuthors = new Set(posts.map(p => p.user_name)).size;

  const suggestions = [
    { name: 'FastAPI',  handle: 'fastapi'  },
    { name: 'OpenAI',   handle: 'openai'   },
    { name: 'Aumne AI', handle: 'aumne_ai' },
  ];

  // Sync local search when global search clears externally
  useEffect(() => {
    if (searchQuery === null) setLocalSearch('');
    else if (searchQuery !== debouncedSearch) setLocalSearch(searchQuery);
  }, [searchQuery]); // intentionally ignoring debouncedSearch here to prevent loops

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch.trim() !== (searchQuery || '')) {
      onSearch(debouncedSearch.trim());
    }
  }, [debouncedSearch, onSearch, searchQuery]);

  return (
    <aside className="right-aside">
      {/* Search */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search microblog"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      {/* Active filter banner */}
      {activeTag && (
        <div className="active-tag-banner">
          <span>Showing <strong>#{activeTag}</strong></span>
          <button className="clear-tag-btn" onClick={() => onTagClick(null)}>✕ Clear</button>
        </div>
      )}

      {/* Stats */}
      <div className="widget-card">
        <div className="widget-title">📊 Stats</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-num">{posts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item likes">
            <span className="stat-num">{totalLikes}</span>
            <span className="stat-label">Likes</span>
          </div>
          <div className="stat-item authors" style={{ gridColumn: '1/-1' }}>
            <span className="stat-num">{totalAuthors}</span>
            <span className="stat-label">Authors</span>
          </div>
        </div>
      </div>

      {/* Engagement Chart */}
      <EngagementChart posts={posts} />

      {/* Live Trending Tags */}
      <div className="widget-card">
        <div className="widget-title">🔥 Trending</div>
        {trending.length > 0 ? (
          trending.map(({ tag, count }) => (
            <div
              key={tag}
              className={`trend-item${activeTag === tag ? ' trend-active' : ''}`}
              onClick={() => onTagClick(activeTag === tag ? null : tag)}
            >
              <div className="trend-context">Trending · microblog</div>
              <div className="trend-topic">#{tag}</div>
              <div className="trend-posts">{count} post{count !== 1 ? 's' : ''}</div>
            </div>
          ))
        ) : (
          <div style={{ color: '#71767b', fontSize: 14, paddingTop: 8 }}>
            No trends yet — post with #hashtags!
          </div>
        )}
      </div>

      {/* Who to follow */}
      <div className="widget-card">
        <div className="widget-title">✨ Who to follow</div>
        {suggestions.map(s => (
          <div key={s.handle} className="follow-item">
            <Avatar name={s.handle} size={40} />
            <div className="follow-info">
              <div className="follow-name">{s.name}</div>
              <div className="follow-handle">@{s.handle}</div>
            </div>
            <button className="follow-btn">Follow</button>
          </div>
        ))}
      </div>

      <div className="aside-footer">
        Terms · Privacy · Cookie Policy<br />
        © 2025 Microblog by Aumne.ai
      </div>
    </aside>
  );
}

/* ── Root App ─────────────────────────────────────────────── */
export default function App() {
  const [posts, setPosts]         = useState([]);
  const [trending, setTrending]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTag, setActiveTag] = useState(null);   // null = show all
  const [searchQuery, setSearchQuery] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [toastMessage, setToastMessage] = useState('');
  const [userName, setUserName]   = useState(
    () => localStorage.getItem('mb_username') || ''
  );
  const [likedPosts, setLikedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_liked') || '[]'); }
    catch { return []; }
  });

  const fetchPosts = useCallback(async (tag = activeTag, search = searchQuery) => {
    try {
      const [postsRes, trendRes] = await Promise.all([
        getPosts(tag, search),
        getTrending(10),
      ]);
      setPosts(postsRes.data);
      setTrending(trendRes.data);
      setError('');
    } catch {
      setError('Cannot reach server. Is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, [activeTag, searchQuery]);

  useEffect(() => {
    fetchPosts(activeTag, searchQuery);
    const id = setInterval(() => fetchPosts(activeTag, searchQuery), 5000);
    return () => clearInterval(id);
  }, [fetchPosts, activeTag, searchQuery]);

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    setSearchQuery(null);
    setActiveTab('home');
    setLoading(true);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (id === 'home') {
      setActiveTag(null);
      setSearchQuery(null);
      setLoading(true);
    } else if (id === 'profile') {
      if (!userName.trim()) {
        showToast('Set your handle first to view profile!');
        setActiveTab('home');
        return;
      }
      setActiveTag(null);
      setSearchQuery(userName.trim());
      setLoading(true);
    } else {
      showToast('This feature will be available in the next release! 🚀');
      setTimeout(() => setActiveTab('home'), 500); // Revert selection
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query || null);
    setActiveTag(null);
    setLoading(true);
  };

  const handleUserNameChange = (v) => {
    setUserName(v);
    localStorage.setItem('mb_username', v);
  };

  const handleLiked = (postId) => {
    const updated = [...likedPosts, postId];
    setLikedPosts(updated);
    localStorage.setItem('mb_liked', JSON.stringify(updated));
    fetchPosts(activeTag, searchQuery);
  };

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="global-toast">
          {toastMessage}
        </div>
      )}

      <LeftNav
        userName={userName}
        onUserNameChange={handleUserNameChange}
        activeTab={activeTab}
        onNavClick={handleNavClick}
      />

      <main className="main-feed">
        {/* Header */}
        <header className="feed-header">
          <span className="feed-header-title">
            {activeTag ? `#${activeTag}` : searchQuery ? `Search: ${searchQuery}` : 'For You'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(activeTag || searchQuery) && (
              <button
                className="clear-filter-pill"
                onClick={() => { setActiveTag(null); setSearchQuery(null); setLoading(true); }}
              >
                ✕ Clear filter
              </button>
            )}
            <div className="live-pill">
              <span className="live-dot" />
              Live
            </div>
          </div>
        </header>

        {/* Compose */}
        <ComposeBox
          userName={userName}
          onPostCreated={() => fetchPosts(activeTag, searchQuery)}
          liveTags={trending}
        />

        {/* Error */}
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* Feed */}
        {loading ? (
          <div className="feed-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-post">
                <div className="skel-avatar" />
                <div className="skel-lines">
                  <div className="skel-line" style={{ width: '40%' }} />
                  <div className="skel-line" style={{ width: '80%' }} />
                  <div className="skel-line" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PostList
            posts={posts}
            userName={userName}
            likedPosts={likedPosts}
            onLiked={handleLiked}
            onTagClick={handleTagClick}
          />
        )}
      </main>

      <RightAside
        posts={posts}
        trending={trending}
        activeTag={activeTag}
        onTagClick={handleTagClick}
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />
    </div>
  );
}

