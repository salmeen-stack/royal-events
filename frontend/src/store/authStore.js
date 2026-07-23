import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("royal_events_user")) || null,
  token: localStorage.getItem("royal_events_token") || null,
  isAuthenticated: !!localStorage.getItem("royal_events_token"),

  login: (userData, token) => {
    localStorage.setItem("royal_events_user", JSON.stringify(userData));
    localStorage.setItem("royal_events_token", token);
    set({
      user: userData,
      token: token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("royal_events_user");
    localStorage.removeItem("royal_events_token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  updateUser: (userData) => {
    localStorage.setItem("royal_events_user", JSON.stringify(userData));
    set({ user: userData });
  },
}));

export default useAuthStore;