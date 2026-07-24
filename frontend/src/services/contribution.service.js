import api from "../config/api";

const contributionService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/contributions", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/contributions/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/contributions/${id}`, data);
    return response.data;
  },

  regenerateLink: async (id) => {
    const response = await api.patch(`/api/contributions/${id}/regenerate-link`);
    return response.data;
  },

  getEventSummary: async (eventId) => {
    const response = await api.get(`/api/contributions/event/${eventId}/summary`);
    return response.data;
  },

  sendRequest: async (contributionId) => {
    const response = await api.post(`/api/contributions/${contributionId}/send-request`);
    return response.data;
  },

  sendBulkRequests: async (eventId) => {
    const response = await api.post("/api/contributions/send-bulk-requests", {
      eventId,
    });
    return response.data;
  },
};

export default contributionService;