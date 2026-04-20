import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export const getPosts    = (tag = null) =>
  API.get('/posts/', { params: tag ? { tag } : {} });

export const createPost  = (content, userName) =>
  API.post('/posts/', { content, user_name: userName });

export const likePost    = (postId, userName) =>
  API.post(`/posts/${postId}/like`, { user_name: userName });

export const getTrending = (limit = 10) =>
  API.get('/posts/trending-tags', { params: { limit } });

export default API;
