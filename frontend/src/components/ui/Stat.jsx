import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const iconBgColors = {
  indigo: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200",
  green: "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200",
  blue: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-200",
  red: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200",
  yellow: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200",
  orange: "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200",
  purple: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200",
  gray: "bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-200",
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
  variant = "default",
}) => {
  const variantStyles = {
    default: "bg-white rounded-2xl border border-gray-200 shadow-sm",
    elevated: "bg-white rounded-2xl border-0 shadow-lg",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border-0 shadow-lg text-white",
  };

  const textColors = variant === "gradient" 
    ? "text-white/90" 
    : "text-gray-500";
  
  const valueColors = variant === "gradient"
    ? "text-white"
    : "text-gray-900";

  return (
    <motion.div
      className={cn(
        variantStyles[variant],
        "p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn("text-sm font-semibold mb-2", textColors)}>{title}</p>
          <motion.p
            className={cn("text-3xl font-bold", valueColors)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className={cn("text-xs mt-2", textColors)}>{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              <FontAwesomeIcon
                icon={changeType === "increase" ? "arrow-trend-up" : "arrow-trend-down"}
                className={cn(
                  "text-sm",
                  changeType === "increase"
                    ? "text-emerald-500"
                    : "text-red-500"
                )}
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  changeType === "increase"
                    ? "text-emerald-600"
                    : "text-red-600"
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <motion.div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-2xl",
              iconBgColors[color]
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.1, type: "spring" }}
          >
            <FontAwesomeIcon icon={icon} className="text-xl" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Stat;