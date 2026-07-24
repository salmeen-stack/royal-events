import api from "../config/api";

const checkinService = {
  getAll: async (params = {}) => {
    const response = await api.get("/api/checkins", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/checkins/${id}`);
    return response.data;
  },

  verifyQR: async (qrToken) => {
    const response = await api.post("/api/checkins/verify/qr", { qrToken });
    return response.data;
  },

  verifyToken: async (smsToken) => {
    const response = await api.post("/api/checkins/verify/token", { smsToken });
    return response.data;
  },

  checkInByQR: async (qrToken, notes = "") => {
    const response = await api.post("/api/checkins/qr", { qrToken, notes });
    return response.data;
  },

  checkInByToken: async (smsToken, notes = "") => {
    const response = await api.post("/api/checkins/token", { smsToken, notes });
    return response.data;
  },

  manualCheckIn: async (guestId, eventId, notes = "") => {
    const response = await api.post("/api/checkins/manual", {
      guestId,
      eventId,
      notes,
    });
    return response.data;
  },

  getEventStats: async (eventId) => {
    const response = await api.get(`/api/checkins/event/${eventId}/stats`);
    return response.data;
  },
};

export default checkinService;