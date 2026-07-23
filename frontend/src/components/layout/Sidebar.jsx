import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import { APP_NAME } from "../../config/constants";
import logo from "../../assets/logo.png";
import { useState } from "react";

const navItems = [
  {
    section: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "gauge",
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "My Dashboard",
        path: "/event-owner-dashboard",
        icon: "gauge",
        roles: ["EVENT_OWNER"],
      },
    ],
  },
  {
    section: "Events",
    items: [
      {
        label: "Events",
        path: "/events",
        icon: "calendar-days",
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "My Events",
        path: "/events",
        icon: "calendar-days",
        roles: ["EVENT_OWNER"],
      },
      {
        label: "Event Owners",
        path: "/event-owners",
        icon: "user-tie",
        roles: ["SUPER_ADMIN", "STAFF"],
      },
    ],
  },
  {
    section: "Guests",
    items: [
      {
        label: "Guests",
        path: "/guests",
        icon: "users",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
      {
        label: "Contributions",
        path: "/contributions",
        icon: "hand-holding-dollar",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
      {
        label: "Transactions",
        path: "/transactions",
        icon: "credit-card",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
    ],
  },
  {
    section: "Invitations",
    items: [
      {
        label: "Invitations",
        path: "/invitations",
        icon: "envelope",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: "bell",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
      {
        label: "Reminders",
        path: "/reminders",
        icon: "clock",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
    ],
  },
  {
    section: "Event Day",
    items: [
      {
        label: "Check-In",
        path: "/checkin",
        icon: "qrcode",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
    ],
  },
  {
    section: "Finance",
    items: [
      {
        label: "Payouts",
        path: "/payouts",
        icon: "money-bill-transfer",
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Reports",
        path: "/reports",
        icon: "chart-bar",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        label: "Users",
        path: "/users",
        icon: "user-gear",
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Audit Logs",
        path: "/audit",
        icon: "shield-halved",
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNav = navItems
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(user?.role)
      ),
    }))
    .filter((section) => section.items.length > 0);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      SUPER_ADMIN: "from-purple-500 to-pink-500",
      STAFF: "from-blue-500 to-cyan-500",
      EVENT_OWNER: "from-indigo-500 to-purple-500",
    };
    return colors[role] || "from-gray-500 to-gray-600";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/30">
          <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain p-1.5" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h1 className="text-white font-bold text-lg leading-none">
              {APP_NAME}
            </h1>
            <p className="text-slate-400 text-xs mt-1">Management System</p>
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
        >
          <FontAwesomeIcon
            icon={isCollapsed ? "angles-right" : "angles-left"}
            className="text-sm"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
        {filteredNav.map((section) => (
          <div key={section.section}>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
              >
                {section.section}
              </motion.p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                      "group relative overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                          isActive
                            ? "bg-white/20"
                            : "bg-slate-700/50 group-hover:bg-slate-600/50"
                        )}
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className={cn(
                            "text-sm",
                            isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                          )}
                        />
                      </div>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                      {isActive && !isCollapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-5 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-sm border border-slate-600/50">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-black/30",
              getRoleColor(user?.role)
            )}
          >
            {getInitials(user?.name)}
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </motion.div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <FontAwesomeIcon icon="right-from-bracket" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;