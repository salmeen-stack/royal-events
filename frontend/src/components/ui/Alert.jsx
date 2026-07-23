import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const alertStyles = {
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "check-circle",
    iconColor: "text-green-500",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "circle-exclamation",
    iconColor: "text-red-500",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "triangle-exclamation",
    iconColor: "text-yellow-500",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "circle-info",
    iconColor: "text-blue-500",
  },
};

const Alert = ({
  type = "info",
  title,
  message,
  show = true,
  onClose,
  className = "",
}) => {
  const style = alertStyles[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border",
            style.container,
            className
          )}
        >
          <FontAwesomeIcon
            icon={style.icon}
            className={cn("text-lg mt-0.5", style.iconColor)}
          />
          <div className="flex-1">
            {title && (
              <p className="text-sm font-semibold mb-0.5">{title}</p>
            )}
            <p className="text-sm">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-black/5 transition-colors"
            >
              <FontAwesomeIcon icon="xmark" className="text-sm" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;