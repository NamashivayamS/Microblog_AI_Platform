import React, { useState, useEffect, useCallback, useRef } from 'react';
import PostList from './components/PostList';
import EngagementChart from './components/EngagementChart';
import HashtagDropdown from './components/HashtagDropdown';
import { getPosts, getTrending, loginUser, registerUser } from './api';
import './App.css';

/* ── Auth Screen Component ────────────────────────────────── */
function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await loginUser(username, password);
        onLoginSuccess(response.data);
      } else {
        await registerUser(name, username, password);
        const response = await loginUser(username, password);
        onLoginSuccess(response.data);
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        let msg = err.response.data.detail;
        if (Array.isArray(msg)) msg = msg[0].msg;
        setError(msg);
      } else {
        setError('Connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src="/logo.png" alt="Microblog Logo" className="auth-logo" style={{ borderRadius: '50%', objectFit: 'cover' }} />
        <h1 className="auth-title">Happening now</h1>
        <p className="auth-subtitle">Join Microblog today.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              className="auth-input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="text"
            className="auth-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing…' : (isLogin ? 'Log in' : 'Sign up')}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="auth-toggle-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

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
function LeftNav({ currentUser, activeTab, onNavClick, onLogout }) {
  const userName = currentUser?.username || 'you';
  const name = currentUser?.name || 'Set your handle';

  return (
    <nav className="left-nav">
      <div className="nav-logo">
        <div className="nav-logo-icon">
          <img src="/logo.png" alt="Microblog Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
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
      
      <div className="nav-profile" style={{ marginTop: 'auto', marginBottom: 16 }}>
        <Avatar name={userName} size={40} />
        <div className="nav-profile-info">
          <div className="nav-profile-name" style={{ fontWeight: 'bold' }}>{name}</div>
          <div className="nav-profile-handle" style={{ fontSize: 13, color: '#71767b' }}>@{userName}</div>
        </div>
      </div>
      
      <button 
        className="post-nav-btn" 
        style={{ background: 'transparent', border: '1px solid #71767b', color: '#e7e9ea' }} 
        onClick={onLogout}
      >
        Log out
      </button>
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
    // eslint-disable-next-line
  }, [debouncedSearch]);

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
        <div className="widget-title">Stats</div>
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mb_user'));
    } catch { return null; }
  });

  const [posts, setPosts]         = useState([]);
  const [trending, setTrending]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTag, setActiveTag] = useState(null);   // null = show all
  const [searchQuery, setSearchQuery] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [toastMessage, setToastMessage] = useState('');
  const [sseConnected, setSseConnected] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);

  const userName = currentUser?.username;

  // Sync liked posts when user changes
  useEffect(() => {
    if (userName) {
      try {
        const stored = JSON.parse(localStorage.getItem(`mb_liked_${userName}`) || '[]');
        setLikedPosts(stored);
      } catch {
        setLikedPosts([]);
      }
    } else {
      setLikedPosts([]);
    }
  }, [userName]);

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

  // ── True Real-Time: Server-Sent Events ────────────────────
  // Replaces the naive 5-second polling with a push-based architecture.
  // The server sends a "refresh" signal only when data actually changes.
  useEffect(() => {
    fetchPosts(activeTag, searchQuery);

    const es = new EventSource('http://localhost:8000/posts/stream');
    es.onopen = () => setSseConnected(true);
    es.onmessage = (e) => {
      if (e.data === 'update') {
        fetchPosts(activeTag, searchQuery);
      }
    };
    es.onerror = () => {
      setSseConnected(false);
      // SSE connection lost — fall back gracefully
      es.close();
    };
    return () => { es.close(); setSseConnected(false); };
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

  const loadFeed = async (tag, search) => {
    setLoading(true);
    try {
      const [postsRes, trendRes] = await Promise.all([
        getPosts(tag, search),
        getTrending(10)
      ]);
      setPosts(postsRes.data);
      setTrending(trendRes.data);
      setError('');
    } catch {
      setError('Cannot reach server.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (id === 'home') {
      setActiveTag(null);
      setSearchQuery(null);
      loadFeed(null, null);
    } else if (id === 'profile') {
      if (!userName.trim()) {
        showToast('Set your handle first to view profile!');
        setActiveTab('home');
        return;
      }
      const query = userName.trim();
      setActiveTag(null);
      setSearchQuery(query);
      loadFeed(null, query);
    } else {
      showToast('This feature will be available in the next release! 🚀');
      setTimeout(() => setActiveTab('home'), 500); 
    }
  };

  const handleSearch = (query) => {
    const q = query || null;
    setActiveTag(null);
    setSearchQuery(q);
    loadFeed(null, q);
  };

  const handleLogout = () => {
    localStorage.removeItem('mb_user');
    setCurrentUser(null);
    setPosts([]);
    setLikedPosts([]);
    setActiveTab('home');
    setSearchQuery(null);
    setActiveTag(null);
  };

  const handleLiked = (postId) => {
    setLikedPosts(prev => {
      const updated = [...prev, postId];
      if (userName) localStorage.setItem(`mb_liked_${userName}`, JSON.stringify(updated));
      return updated;
    });
    fetchPosts(activeTag, searchQuery);
  };

  if (!currentUser) {
    return (
      <AuthScreen 
        onLoginSuccess={(user) => {
          localStorage.setItem('mb_user', JSON.stringify(user));
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="global-toast">
          {toastMessage}
        </div>
      )}

      <LeftNav
        currentUser={currentUser}
        activeTab={activeTab}
        onNavClick={handleNavClick}
        onLogout={handleLogout}
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
            <div className={`live-pill${sseConnected ? '' : ' live-pill-offline'}`}>
              <span className="live-dot" />
              {sseConnected ? 'Live' : 'Connecting…'}
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

