import axios from 'axios';

// Initialize the main Axios instance pointing to our local FastAPI server
// All payload requests default to JSON
const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Fetch feed posts. We use params object here so Axios auto-builds 
// query strings (e.g., ?tag=react&search=test) to keep our URLs clean.
export const getPosts = (tag = null, search = null) => {
  const params = {};
  if (tag) params.tag = tag;
  if (search) params.search = search;
  return API.get('/posts/', { params });
};

// Dispatch a new microblog post. Expects standard 280 char limit.
export const createPost = (content, userName) =>
  API.post('/posts/', { content, user_name: userName });

// Append a nested comment under a specific post
export const createComment = (postId, content, userName) =>
  API.post(`/posts/${postId}/comments`, { content, user_name: userName });

// Trigger the post like endpoint (backend ensures 1 vote per user)
export const likePost = (postId, userName) =>
  API.post(`/posts/${postId}/like`, { user_name: userName });

// Pulls the most active tags from the last 100 recent posts
export const getTrending = (limit = 10) =>
  API.get('/posts/trending-tags', { params: { limit } });

// Authentication Routes
export const registerUser = (name, username, password) =>
  API.post('/auth/register', { name, username, password });

export const loginUser = (username, password) =>
  API.post('/auth/login', { username, password });

export default API;
