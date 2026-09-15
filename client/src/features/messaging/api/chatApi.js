import api from '../../../utils/api';

// Deterministic 1-on-1 conversation id (mirrors server Message.buildConversationId)
export const buildConversationId = (a, b) => [a.toString(), b.toString()].sort().join('_');

export const fetchConversations = () => api.get('/messages/conversations').then((r) => r.data);
export const fetchHistory = (otherUserId) => api.get(`/messages/history/${otherUserId}`).then((r) => r.data);

// People directory — search by name / email / USN / department
export const searchUsers = (q) => api.get('/users', { params: { search: q } }).then((r) => r.data);

export const chatApi = { fetchConversations, fetchHistory, searchUsers, buildConversationId };
