import React, { useEffect, useRef } from 'react';

/* ── Master preset tag library ──────────────────────────────
   Merged at render time with live platform tags.
   Categories cover Tech, AI, Dev, Social, Lifestyle, Fun, General.
──────────────────────────────────────────────────────────── */
export const PRESET_TAGS = [
  // Technology & Dev
  'python', 'javascript', 'typescript', 'reactjs', 'fastapi', 'nodejs',
  'nextjs', 'vuejs', 'angular', 'django', 'flask', 'rust', 'golang',
  'docker', 'kubernetes', 'linux', 'opensource', 'github', 'git',
  'database', 'sqlite', 'postgresql', 'mongodb', 'redis',
  'api', 'restapi', 'graphql', 'openapi', 'sdk', 'backend', 'frontend',
  'fullstack', 'devops', 'cloudcomputing', 'aws', 'azure', 'gcp',
  'cybersecurity', 'blockchain', 'webdev', 'mobiledev', 'ux', 'ui', 'design',
  // AI / ML
  'ai', 'machinelearning', 'deeplearning', 'llm', 'genai', 'chatgpt',
  'openai', 'huggingface', 'nlp', 'computervision', 'pytorch', 'tensorflow',
  'rag', 'promptengineering', 'aitools', 'aumneai',
  // Social / General
  'coding', 'programming', 'codenewbie', 'buildingpublicly', 'learntocode',
  '100daysofcode', 'productivity', 'motivation', 'career', 'jobs', 'internship',
  'startup', 'entrepreneur', 'innovation', 'technology', 'future', 'trending',
  'news', 'discussion', 'question', 'poll', 'tip', 'tutorial', 'resourcesharing',
  // Fun / Lifestyle
  'funny', 'fun', 'memes', 'gaming', 'music', 'movies', 'sports', 'travel',
  'food', 'health', 'fitness', 'mindfulness', 'photography', 'art', 'books',
];

/**
 * HashtagDropdown
 *
 * Props:
 *  query       – the partial tag the user is typing (e.g. "fa")
 *  liveTags    – tags already on the platform [{tag, count}]
 *  onSelect    – callback(tag: string) when user picks one
 *  onClose     – callback to close dropdown (Escape / outside click)
 */
export default function HashtagDropdown({ query, liveTags, activeIndex, onSelect, onClose }) {
  const ref = useRef(null);

  // Merge & deduplicate: live tags first (sorted by count), then presets
  const liveSet = new Set(liveTags.map(t => t.tag));
  const allTags = [
    ...liveTags.map(t => ({ tag: t.tag, count: t.count, live: true })),
    ...PRESET_TAGS.filter(t => !liveSet.has(t)).map(t => ({ tag: t, count: 0, live: false })),
  ];

  // Filter by prefix (case-insensitive)
  const q = query.toLowerCase();
  const matches = q.length === 0
    ? allTags.slice(0, 10)
    : allTags.filter(t => t.tag.startsWith(q)).slice(0, 8);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (matches.length === 0) return null;

  return (
    <div className="hashtag-dropdown" ref={ref}>
      <div className="hashtag-dropdown-header">Hashtag suggestions</div>
      {matches.map(({ tag, count, live }, index) => (
        <div
          key={tag}
          className={`hashtag-dropdown-item${index === activeIndex ? ' active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(tag); }}
        >
          <span className="hashtag-dropdown-tag">#{tag}</span>
          {live && count > 0 && (
            <span className="hashtag-dropdown-count">{count} post{count !== 1 ? 's' : ''}</span>
          )}
          {!live && (
            <span className="hashtag-dropdown-badge">popular</span>
          )}
        </div>
      ))}
      <div className="hashtag-dropdown-footer">↑↓ to browse · Enter to select · or keep typing</div>
    </div>
  );
}
