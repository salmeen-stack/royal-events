import api from "../config/api";

const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  sendSMS: async (data) => {
    const response = await api.post("/notifications/send-sms", data);
    return response.data;
  },

  sendWhatsApp: async (data) => {
    const response = await api.post("/notifications/send-whatsapp", data);
    return response.data;
  },

  sendBulkReminders: async (eventId) => {
    const response = await api.post("/notifications/bulk-reminders", {
      eventId,
    });
    return response.data;
  },

  getEventStats: async (eventId) => {
    const response = await api.get(`/notifications/event/${eventId}/stats`);
    return response.data;
  },
};

export default notificationService;