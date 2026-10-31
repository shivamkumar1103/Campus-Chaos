import api from "@/utils/api";

export const adminApi = {
  // Stats
  getOverview: () => api.get("/admin/overview").then((r) => r.data),

  // Users
  getUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  createUser: (data) => api.post("/admin/users", data).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),

  // Rooms
  getRooms: (params) => api.get("/rooms", { params }).then((r) => r.data),
  createRoom: (data) => api.post("/admin/rooms", data).then((r) => r.data),
  updateRoom: (id, data) => api.patch(`/admin/rooms/${id}`, data).then((r) => r.data),
  deleteRoom: (id) => api.delete(`/admin/rooms/${id}`).then((r) => r.data),

  // Timetable
  getTimetable: (params) => api.get("/admin/timetable", { params }).then((r) => r.data),
  createTimetableEntry: (data) => api.post("/admin/timetable", data).then((r) => r.data),
  updateTimetableEntry: (id, data) => api.patch(`/admin/timetable/${id}`, data).then((r) => r.data),
  deleteTimetableEntry: (id) => api.delete(`/admin/timetable/${id}`).then((r) => r.data),
  uploadTimetableCsv: (formData) =>
    api.post("/admin/timetable/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Lost & Found Moderation
  getLostFound: (params) => api.get("/admin/lost-found", { params }).then((r) => r.data),
  updateLostFoundStatus: (id, status) => api.patch(`/admin/lost-found/${id}/status`, { status }).then((r) => r.data),
  deleteLostFound: (id) => api.delete(`/admin/lost-found/${id}`).then((r) => r.data),

  // Chat Safety & Audit
  getChatThreads: () => api.get("/admin/chats/threads").then((r) => r.data),
  getChatHistory: (user1Id, user2Id) => api.get(`/admin/chats/history/${user1Id}/${user2Id}`).then((r) => r.data),
};
