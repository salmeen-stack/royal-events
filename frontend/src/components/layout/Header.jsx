import { useState } from "react";
import { motion } from "framer-motion";
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPER_ADMIN: "bg-purple-100 text-purple-700",
      STAFF: "bg-blue-100 text-blue-700",
      EVENT_OWNER: "bg-indigo-100 text-indigo-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const formatRole = (role) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-100 shadow-sm">
      {/* Left - Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FontAwesomeIcon icon="bars" className="text-lg" />
        </button>
      </div>

      {/* Right - User Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications Bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <FontAwesomeIcon icon="bell" className="text-lg" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatRole(user?.role)}
              </p>
            </div>
            <FontAwesomeIcon
              icon="chevron-down"
              className={cn(
                "text-xs text-gray-400 transition-transform duration-200",
                showDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                  <span
                    className={cn(
                      "inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      getRoleBadgeColor(user?.role)
                    )}
                  >
                    {formatRole(user?.role)}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/profile");
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon="user"
                      className="text-gray-400 w-4"
                    />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/change-password");
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon="lock"
                      className="text-gray-400 w-4"
                    />
                    Change Password
                  </button>
                </div>

                {/* Logout */}
                <div className="py-1 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon="right-from-bracket"
                      className="w-4"
                    />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;