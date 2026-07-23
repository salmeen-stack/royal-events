import api from "../config/api";

const invitationService = {
  getAll: async (params = {}) => {
    const response = await api.get("/invitations", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/invitations/${id}`);
    return response.data;
  },

  getQRCode: async (id) => {
    const response = await api.get(`/invitations/${id}/qrcode`);
    return response.data;
  },

  generate: async (data) => {
    const response = await api.post("/invitations/generate", data);
    return response.data;
  },

  bulkGenerate: async (data) => {
    const response = await api.post("/invitations/bulk-generate", data);
    return response.data;
  },

  release: async (contributionId) => {
    const response = await api.post("/invitations/release", {
      contributionId,
    });
    return response.data;
  },

  send: async (id) => {
    const response = await api.post(`/invitations/${id}/send`);
    return response.data;
  },

  verifyQR: async (token) => {
    const response = await api.get(`/invitations/verify/qr/${token}`);
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await api.post("/invitations/verify/token", { token });
    return response.data;
  },
};

export default invitationService;