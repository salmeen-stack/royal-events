import api from "../config/api";

const transactionService = {
  getAll: async (params = {}) => {
    const response = await api.get("/transactions", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  initiatePayment: async (data) => {
    const response = await api.post("/transactions/initiate", data);
    return response.data;
  },

  getEventSummary: async (eventId) => {
    const response = await api.get(`/transactions/event/${eventId}/summary`);
    return response.data;
  },
};

export default transactionService;