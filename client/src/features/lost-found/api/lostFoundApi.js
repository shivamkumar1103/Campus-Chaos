import api from '../../../utils/api';

// Backend serves images as "/uploads/<file>"; resolve against the API origin.
export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const origin = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

// GET /lost-found?q=&type=&category=&status=
export const fetchItems = (params = {}) => api.get('/lost-found', { params }).then((r) => r.data);
export const fetchItem = (id) => api.get(`/lost-found/${id}`).then((r) => r.data);
export const reportItem = (formData) =>
  api.post('/lost-found', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const claimItem = (id, claimProof) => api.post(`/lost-found/${id}/claim`, { claimProof }).then((r) => r.data);
export const deleteItem = (id) => api.delete(`/lost-found/${id}`).then((r) => r.data);
export const updateItemStatus = (id, status) => api.patch(`/lost-found/${id}/status`, { status }).then((r) => r.data);

export const lostFoundApi = { fetchItems, fetchItem, reportItem, claimItem, deleteItem, updateItemStatus };

export const LOST_FOUND_TYPES = ['lost', 'found'];
export const LOST_FOUND_CATEGORIES = ['electronics', 'id_cards', 'books', 'keys', 'accessories', 'clothing', 'other'];
export const LOST_FOUND_STATUSES = ['open', 'claimed', 'resolved'];
