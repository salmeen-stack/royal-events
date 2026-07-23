import { cn } from "../../utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const colorMap = {
  green: "bg-green-100 text-green-700 border-green-200",
  red: "bg-red-100 text-red-700 border-red-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
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
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
};

const Badge = ({
  children,
  color,
  status,
  size = "md",
  icon,
  dot = false,
  className = "",
}) => {
  const resolvedColor = color || statusColorMap[status] || "gray";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border",
        "whitespace-nowrap",
        colorMap[resolvedColor],
        sizeMap[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            resolvedColor === "green" && "bg-green-500",
            resolvedColor === "red" && "bg-red-500",
            resolvedColor === "yellow" && "bg-yellow-500",
            resolvedColor === "blue" && "bg-blue-500",
            resolvedColor === "gray" && "bg-gray-500",
            resolvedColor === "orange" && "bg-orange-500",
            resolvedColor === "purple" && "bg-purple-500",
            resolvedColor === "indigo" && "bg-indigo-500"
          )}
        />
      )}
      {icon && <FontAwesomeIcon icon={icon} className="text-[10px]" />}
      {children || status}
    </span>
  );
};

export default Badge;