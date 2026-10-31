import api from "@/utils/api";

export const pollsApi = {
  getPolls: (params) => api.get("/polls", { params }).then((r) => r.data),
  getPoll: (id) => api.get(`/polls/${id}`).then((r) => r.data),
  createPoll: (data) => api.post("/polls", data).then((r) => r.data),
  vote: (id, optionId) => api.post(`/polls/${id}/vote`, { optionId }).then((r) => r.data),
  closePoll: (id) => api.patch(`/polls/${id}/close`).then((r) => r.data),
  deletePoll: (id) => api.delete(`/polls/${id}`).then((r) => r.data),
};
