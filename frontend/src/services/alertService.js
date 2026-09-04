import api from "./api";

export const alertService = {
  list: () => api.get("/alerts").then((res) => res.data),
  dismiss: (shiftId) => api.post(`/alerts/${shiftId}/dismiss`).then((res) => res.data),
};
