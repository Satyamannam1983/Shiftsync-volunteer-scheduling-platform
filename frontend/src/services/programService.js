import api from "./api";

export const programService = {
  list: (params) => api.get("/programs", { params }).then((res) => res.data),
  get: (id) => api.get(`/programs/${id}`).then((res) => res.data),
  create: (payload) => api.post("/programs", payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/programs/${id}`, payload).then((res) => res.data),
  archive: (id) => api.post(`/programs/${id}/archive`).then((res) => res.data),
  restore: (id) => api.post(`/programs/${id}/restore`).then((res) => res.data),
  members: (programId) => api.get(`/programs/${programId}/members`).then((res) => res.data),
  addMember: (programId, volunteerId) =>
    api.post(`/programs/${programId}/members`, { volunteerId }).then((res) => res.data),
  removeMember: (programId, volunteerId) =>
    api.delete(`/programs/${programId}/members/${volunteerId}`).then((res) => res.data),
  generateRecurring: (programId, payload) =>
    api.post(`/programs/${programId}/shifts/recurring`, payload).then((res) => res.data),
  exportRoster: async (programId) => {
    const res = await api.get(`/programs/${programId}/roster/export`, { responseType: "blob" });
    return res.data;
  },
};
