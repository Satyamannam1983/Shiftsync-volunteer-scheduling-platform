import api from "./api";

export const dashboardService = {
  summary: () => api.get("/dashboard/summary").then((res) => res.data),
};

export const alertService = {
  list: () => api.get("/alerts").then((res) => res.data),
  dismiss: (shiftId) => api.post(`/alerts/${shiftId}/dismiss`).then((res) => res.data),
};

export const userService = {
  volunteers: (search) => api.get("/users", { params: { search } }).then((res) => res.data),
};
