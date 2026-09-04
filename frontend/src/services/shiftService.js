import api from "./api";

export const shiftService = {
  list: (params) => api.get("/shifts", { params }).then((res) => res.data),
  get: (id) => api.get(`/shifts/${id}`).then((res) => res.data),
  create: (payload) => api.post("/shifts", payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/shifts/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/shifts/${id}`).then((res) => res.data),
  close: (id) => api.post(`/shifts/${id}/close`).then((res) => res.data),
  history: (id) => api.get(`/shifts/${id}/history`).then((res) => res.data),
  addNote: (id, note) => api.post(`/shifts/${id}/notes`, { note }).then((res) => res.data),
  signups: (id) => api.get(`/shifts/${id}/signups`).then((res) => res.data),
  signup: (shiftId, volunteerId) =>
    api.post(`/shifts/${shiftId}/signups`, volunteerId ? { volunteerId } : {}).then((res) => res.data),
  cancelSignup: (shiftId, signupId) =>
    api.delete(`/shifts/${shiftId}/signups/${signupId}`).then((res) => res.data),
};

export const signupService = {
  mine: () => api.get("/signups/me").then((res) => res.data),
};
