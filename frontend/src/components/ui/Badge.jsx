import { cn } from "../../utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const colorMap = {
  green: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-200",
  red: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-200",
  yellow: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200",
  blue: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-200",
  gray: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-200",
  orange: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200",
  purple: "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-200",
  indigo: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200",
  pink: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200",
};

const statusColorMap = {
  PENDING: "yellow",
  PARTIAL: "orange",
  PAID: "green",
  OVERDUE: "red",
  SUCCESSFUL: "green",
  FAILED: "red",
  REVERSED: "gray",
  DRAFT: "gray",
  ACTIVE: "green",
  COMPLETED: "blue",
  CANCELLED: "red",
  SENT: "blue",
  DELIVERED: "green",
  PROCESSED: "green",
  SUPER_ADMIN: "purple",
  STAFF: "blue",
  EVENT_OWNER: "indigo",
  QR_SCAN: "indigo",
  SMS_TOKEN: "blue",
  MANUAL: "gray",
  SMS: "blue",
  WHATSAPP: "green",
  BOTH: "purple",
};

const sizeMap = {
  xs: "px-2 py-1 text-[10px] rounded-lg",
  sm: "px-2.5 py-1 text-xs rounded-lg",
  md: "px-3 py-1.5 text-xs rounded-xl",
  lg: "px-4 py-2 text-sm rounded-xl",
};

const Badge = ({
  children,
  color,
  status,
  size = "md",
  icon,
  dot = false,
  className = "",
  variant = "default",
}) => {
  const resolvedColor = color || statusColorMap[status] || "gray";

  const variantStyles = {
    default: "",
      outline: "bg-transparent border-2 shadow-none",
    };

  const outlineColorMap = {
    green: "text-emerald-600 border-emerald-600",
    red: "text-red-600 border-red-600",
    yellow: "text-amber-600 border-amber-600",
    blue: "text-blue-600 border-blue-600",
    gray: "text-gray-600 border-gray-600",
    orange: "text-orange-600 border-orange-600",
    purple: "text-purple-600 border-purple-600",
    indigo: "text-indigo-600 border-indigo-600",
    pink: "text-pink-600 border-pink-600",
  };

  const isOutline = variant === "outline";
  const colorStyle = isOutline ? outlineColorMap[resolvedColor] : colorMap[resolvedColor];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        "whitespace-nowrap transition-all duration-200",
        "hover:scale-105 active:scale-95",
        variantStyles[variant],
        colorStyle,
        sizeMap[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            isOutline && resolvedColor === "green" && "bg-emerald-500",
            isOutline && resolvedColor === "red" && "bg-red-500",
            isOutline && resolvedColor === "yellow" && "bg-amber-500",
            isOutline && resolvedColor === "blue" && "bg-blue-500",
            isOutline && resolvedColor === "gray" && "bg-gray-500",
            isOutline && resolvedColor === "orange" && "bg-orange-500",
            isOutline && resolvedColor === "purple" && "bg-purple-500",
            isOutline && resolvedColor === "indigo" && "bg-indigo-500",
            !isOutline && "bg-white/80"
          )}
        />
      )}
      {icon && <FontAwesomeIcon icon={icon} className="text-xs" />}
      {children || status}
    </span>
  );
};

export default Badge;