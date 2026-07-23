import api from "../config/api";

const eventOwnerService = {
  getAll: async (params = {}) => {
    const response = await api.get("/event-owners", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/event-owners/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/event-owners", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/event-owners/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/event-owners/${id}/toggle-status`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/event-owners/${id}`);
    return response.data;
  },
};

export default eventOwnerService;