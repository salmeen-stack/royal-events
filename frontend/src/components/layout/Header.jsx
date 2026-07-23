import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { cn } from "../../utils/helpers";

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getRoleGradient = (role) => {
    const gradients = {
      SUPER_ADMIN: "from-purple-500 to-pink-500",
      STAFF: "from-blue-500 to-cyan-500",
      EVENT_OWNER: "from-indigo-500 to-purple-500",
    };
    return gradients[role] || "from-gray-500 to-gray-600";
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      STAFF: "bg-blue-100 text-blue-700 border-blue-200",
      EVENT_OWNER: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatRole = (role) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      {/* Left - Menu Toggle */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onMenuToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
        >
          <FontAwesomeIcon icon="bars" className="text-lg" />
        </motion.button>
      </div>

      {/* Right - User Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
        >
          <FontAwesomeIcon icon="bell" className="text-lg" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse" />
        </motion.button>

        {/* User Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 bg-gradient-to-br rounded-xl text-white text-sm font-bold shadow-lg",
              getRoleGradient(user?.role)
            )}>
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatRole(user?.role)}
              </p>
            </div>
            <motion.div
              animate={{ rotate: showDropdown ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FontAwesomeIcon
                icon="chevron-down"
                className="text-xs text-gray-400"
              />
            </motion.div>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showDropdown && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div
                  className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-2xl shadow-gray-200/50 z-20 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, type: "spring" }}
                >
                  {/* User Info */}
                  <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 bg-gradient-to-br rounded-xl text-white text-lg font-bold shadow-lg",
                        getRoleGradient(user?.role)
                      )}>
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold border",
                        getRoleBadgeColor(user?.role)
                      )}
                    >
                      {formatRole(user?.role)}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-indigo-50/50 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon="user"
                        className="text-gray-400 w-4"
                      />
                      My Profile
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/change-password");
                      }}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm text-gray-700 hover:bg-indigo-50/50 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon="lock"
                        className="text-gray-400 w-4"
                      />
                      Change Password
                    </motion.button>
                  </div>

                  {/* Logout */}
                  <div className="py-2 border-t border-gray-100">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon="right-from-bracket"
                        className="w-4"
                      />
                      Sign Out
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;