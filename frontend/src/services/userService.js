import api from "./api";

export const userService = {
  volunteers: (search) => api.get("/users", { params: { search } }).then((res) => res.data),
};
