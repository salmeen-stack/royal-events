import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const alertStyles = {
  success: {
    container: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900",
    icon: "check-circle",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200",
    iconColor: "text-emerald-500",
    accent: "bg-emerald-500",
  },
  error: {
    container: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900",
    icon: "circle-exclamation",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200",
    iconColor: "text-red-500",
    accent: "bg-red-500",
  },
  warning: {
    container: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900",
    icon: "triangle-exclamation",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200",
    iconColor: "text-amber-500",
    accent: "bg-amber-500",
  },
  info: {
    container: "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-900",
    icon: "circle-info",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-200",
    iconColor: "text-blue-500",
    accent: "bg-blue-500",
  },
};

const Alert = ({
  type = "info",
  title,
  message,
  show = true,
  onClose,
  className = "",
  variant = "default",
  duration = 5000,
}) => {
  const style = alertStyles[type];
  const isToast = variant === "toast";

  const containerStyles = isToast
    ? "bg-white border-0 shadow-2xl shadow-gray-200/50"
    : style.container;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: isToast ? 100 : 0, y: isToast ? 0 : -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: isToast ? 100 : 0, y: isToast ? 0 : -20 }}
          transition={{ duration: 0.3, type: "spring" }}
          className={cn(
            "relative overflow-hidden rounded-2xl border",
            containerStyles,
            isToast ? "min-w-[320px] max-w-md" : "w-full",
            className
          )}
        >
          {/* Accent bar for toast variant */}
          {isToast && (
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />
          )}
          
          <div className="flex items-start gap-4 p-5">
            {/* Icon */}
            <motion.div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0",
                isToast ? style.iconBg : ""
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <FontAwesomeIcon
                icon={style.icon}
                className={cn("text-lg", isToast ? "text-white" : style.iconColor)}
              />
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-bold mb-1"
                >
                  {title}
                </motion.p>
              )}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm leading-relaxed"
              >
                {message}
              </motion.p>
            </div>
            
            {/* Close button */}
            {onClose && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors flex-shrink-0"
              >
                <FontAwesomeIcon icon="xmark" className="text-sm opacity-60 hover:opacity-100 transition-opacity" />
              </motion.button>
            )}
          </div>
          
          {/* Progress bar for auto-dismiss */}
          {isToast && duration > 0 && (
            <motion.div
              className={cn("absolute bottom-0 left-0 right-0 h-1", style.accent)}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ToastContainer = ({ children, position = "bottom-right" }) => {
  const positionStyles = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 pointer-events-none",
        positionStyles[position]
      )}
    >
      {children}
    </div>
  );
};

Alert.Container = ToastContainer;

export default Alert;