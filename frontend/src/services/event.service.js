import api from "../config/api";

const eventService = {
  getAll: async (params = {}) => {
    const response = await api.get("/events", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/events/${id}/stats`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/events", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

export default eventService;