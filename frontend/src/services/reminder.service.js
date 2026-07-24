import api from "../config/api";

const reminderService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/reminders", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/reminders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/api/reminders", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/reminders/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/reminders/${id}`);
    return response.data;
  },

  sendContributionReminders: async (eventId) => {
    const response = await api.post("/api/reminders/send-contribution-reminders", {
      eventId,
    });
    return response.data;
  },

  sendEventReminders: async (eventId) => {
    const response = await api.post("/api/reminders/send-event-reminders", {
      eventId,
    });
    return response.data;
  },
};

export default reminderService;