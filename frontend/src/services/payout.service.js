import api from "../config/api";

const payoutService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/payouts", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/payouts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/payouts", data);
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await api.patch(`/api/payouts/${id}/status`, data);
    return response.data;
  },

  getEventSummary: async (eventId) => {
    const response = await api.get(`/api/payouts/event/${eventId}/summary`);
    return response.data;
  },
};

export default payoutService;