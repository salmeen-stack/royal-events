import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

const CircularProgress = ({
  value = 0,
  size = 120,
  strokeWidth = 8,
  color = "indigo",
  showLabel = true,
  label = "",
  className = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    indigo: "stroke-indigo-600",
    green: "stroke-emerald-600",
    blue: "stroke-blue-600",
    red: "stroke-red-600",
    orange: "stroke-orange-600",
    purple: "stroke-purple-600",
    pink: "stroke-pink-600",
  };

  const bgGradientMap = {
    indigo: "from-indigo-500 to-purple-600",
    green: "from-emerald-500 to-green-600",
    blue: "from-blue-500 to-cyan-600",
    red: "from-red-500 to-rose-600",
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-pink-600",
    pink: "from-pink-500 to-rose-500",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={cn(colorMap[color])}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Center content */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {Math.round(value)}%
          </motion.span>
          {label && (
            <span className="text-xs text-gray-500 mt-1">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

const CircularProgressWithIcon = ({
  value = 0,
  size = 120,
  strokeWidth = 8,
  color = "indigo",
  icon,
  className = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    indigo: "stroke-indigo-600",
    green: "stroke-emerald-600",
    blue: "stroke-blue-600",
    red: "stroke-red-600",
    orange: "stroke-orange-600",
    purple: "stroke-purple-600",
    pink: "stroke-pink-600",
  };

  const bgGradientMap = {
    indigo: "from-indigo-500 to-purple-600",
    green: "from-emerald-500 to-green-600",
    blue: "from-blue-500 to-cyan-600",
    red: "from-red-500 to-rose-600",
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-pink-600",
    pink: "from-pink-500 to-rose-500",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color === "indigo" ? "#6366f1" : 
              color === "green" ? "#10b981" : 
              color === "blue" ? "#3b82f6" : 
              color === "red" ? "#ef4444" : 
              color === "orange" ? "#f97316" : 
              color === "purple" ? "#a855f7" : 
              color === "pink" ? "#ec4899" : "#6366f1"} />
            <stop offset="100%" stopColor={color === "indigo" ? "#9333ea" : 
              color === "green" ? "#059669" : 
              color === "blue" ? "#06b6d4" : 
              color === "red" ? "#f43f5e" : 
              color === "orange" ? "#f59e0b" : 
              color === "purple" ? "#ec4899" : 
              color === "pink" ? "#f43f5e" : "#9333ea"} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg",
            bgGradientMap[color]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {icon}
        </motion.div>
        <motion.span
          className="text-lg font-bold text-gray-900 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(value)}%
        </motion.span>
      </div>
    </div>
  );
};

CircularProgress.WithIcon = CircularProgressWithIcon;

export default CircularProgress;
