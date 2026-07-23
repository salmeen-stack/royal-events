import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const iconBgColors = {
  indigo: "bg-indigo-100 text-indigo-600",
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-600",
  yellow: "bg-yellow-100 text-yellow-600",
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  gray: "bg-gray-100 text-gray-600",
};

const Stat = ({
  title,
  value,
  icon,
  color = "indigo",
  change,
  changeType,
  subtitle,
  className = "",
  delay = 0,
}) => {
  return (
    <motion.div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm p-5",
        "hover:shadow-md hover:border-gray-200 transition-all duration-200",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <motion.p
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <FontAwesomeIcon
                icon={changeType === "increase" ? "arrow-up" : "arrow-down"}
                className={cn(
                  "text-xs",
                  changeType === "increase"
                    ? "text-green-500"
                    : "text-red-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  changeType === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-lg",
              iconBgColors[color]
            )}
          >
            <FontAwesomeIcon icon={icon} className="text-lg" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Stat;