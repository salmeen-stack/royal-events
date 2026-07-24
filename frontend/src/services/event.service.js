import api from "../config/api";

const eventService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/events", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/events/${id}`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/api/events/${id}/stats`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/events", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/events/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/events/${id}`);
    return response.data;
  },
};

export default eventService;