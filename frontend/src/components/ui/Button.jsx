import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const variants = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500",
  success:
    "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  warning:
    "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  outline:
    "bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
  xl: "px-6 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <FontAwesomeIcon
            icon="spinner"
            className="animate-spin"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <FontAwesomeIcon icon={icon} className="text-sm" />
          )}
          {children}
          {icon && iconPosition === "right" && (
            <FontAwesomeIcon icon={icon} className="text-sm" />
          )}
        </>
      )}
    </button>
  );
};

export default Button;