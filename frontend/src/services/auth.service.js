import api from "../config/api";

const authService = {
  login: async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;