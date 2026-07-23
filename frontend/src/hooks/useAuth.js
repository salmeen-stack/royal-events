import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { ROLES } from "../config/constants";

const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, updateUser } =
    useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (userData, authToken) => {
    login(userData, authToken);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isSuperAdmin = () => {
    return user?.role === ROLES.SUPER_ADMIN;
  };

  const isStaff = () => {
    return (
      user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.STAFF
    );
  };

  const isEventOwner = () => {
    return user?.role === ROLES.EVENT_OWNER;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (...roles) => {
    return roles.includes(user?.role);
  };

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
    isSuperAdmin,
    isStaff,
    isEventOwner,
    hasRole,
    hasAnyRole,
  };
};

export default useAuth;