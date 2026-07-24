import api from "../config/api";

const userService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/users", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/users", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/api/users/${id}/toggle-status`);
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await api.patch(`/api/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },
};

export default userService;