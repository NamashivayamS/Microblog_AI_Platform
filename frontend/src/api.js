import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export const getPosts    = (tag = null, search = null) => {
  const params = {};
  if (tag) params.tag = tag;
  if (search) params.search = search;
  return API.get('/posts/', { params });
};

export const createPost  = (content, userName) =>
  API.post('/posts/', { content, user_name: userName });

export const likePost    = (postId, userName) =>
  API.post(`/posts/${postId}/like`, { user_name: userName });

export const getTrending = (limit = 10) =>
  API.get('/posts/trending-tags', { params: { limit } });

export const registerUser = (name, username, password) =>
  API.post('/auth/register', { name, username, password });

export const loginUser = (username, password) =>
  API.post('/auth/login', { username, password });

export default API;
