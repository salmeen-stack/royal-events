import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import { APP_NAME } from "../../config/constants";
import logo from "../../assets/logo.png";

const navItems = [
  {
    section: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "gauge",
        roles: ["SUPER_ADMIN", "STAFF", "EVENT_OWNER"],
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
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "Contributions",
        path: "/contributions",
        icon: "hand-holding-dollar",
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "Transactions",
        path: "/transactions",
        icon: "credit-card",
        roles: ["SUPER_ADMIN", "STAFF"],
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
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: "bell",
        roles: ["SUPER_ADMIN", "STAFF"],
      },
      {
        label: "Reminders",
        path: "/reminders",
        icon: "clock",
        roles: ["SUPER_ADMIN", "STAFF"],
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
        roles: ["SUPER_ADMIN", "STAFF"],
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
        roles: ["SUPER_ADMIN", "STAFF"],
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-9 h-9 bg-white rounded-lg overflow-hidden">
          <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-none">
            {APP_NAME}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {filteredNav.map((section) => (
          <div key={section.section}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={cn(
                          "text-sm w-4 text-center",
                          isActive ? "text-white" : "text-slate-500"
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
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
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:z-20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
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