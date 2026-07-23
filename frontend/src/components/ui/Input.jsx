import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const Input = forwardRef(
  (
    {
      label,
      error,
      icon,
      type = "text",
      placeholder,
      className = "",
      containerClass = "",
      required = false,
      helperText,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "border-gray-200 bg-white focus:border-indigo-500 focus:ring-indigo-500",
      filled: "border-0 bg-gray-100 focus:bg-gray-50 focus:ring-indigo-500",
      outline: "border-2 bg-transparent focus:border-indigo-500 focus:ring-indigo-500",
    };

    return (
      <div className={cn("w-full", containerClass)}>
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={icon}
                className="text-gray-400 text-sm group-focus-within:text-indigo-500 transition-colors duration-200"
              />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-xl border-2",
              "px-4 py-3 text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-all duration-300 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-100",
              "hover:border-gray-300",
              icon && "pl-11",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500 hover:border-red-400",
              !error && variantStyles[variant],
              className
            )}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon="circle-exclamation"
                className="text-red-500 text-sm"
              />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 animate-slide-down">
            <FontAwesomeIcon icon="circle-exclamation" className="text-xs" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
            <FontAwesomeIcon icon="circle-info" className="text-xs text-gray-400" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;