import api from "../config/api";

const reportService = {
  getSystemReport: async () => {
    const response = await api.get("/api/reports/system");
    return response.data;
  },

  getEventFinancialReport: async (eventId) => {
    const response = await api.get(`/api/reports/event/${eventId}/financial`);
    return response.data;
  },

  getEventGuestReport: async (eventId) => {
    const response = await api.get(`/api/reports/event/${eventId}/guests`);
    return response.data;
  },

  getEventInvitationReport: async (eventId) => {
    const response = await api.get(`/api/reports/event/${eventId}/invitations`);
    return response.data;
  },

  getEventAttendanceReport: async (eventId) => {
    const response = await api.get(`/api/reports/event/${eventId}/attendance`);
    return response.data;
  },

  getCompleteEventReport: async (eventId) => {
    const response = await api.get(`/api/reports/event/${eventId}/complete`);
    return response.data;
  },
};

export default reportService;