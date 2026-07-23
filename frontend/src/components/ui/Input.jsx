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
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("w-full", containerClass)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={icon}
                className="text-gray-400 text-sm"
              />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white",
              "px-3.5 py-2.5 text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              icon && "pl-10",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <FontAwesomeIcon icon="circle-exclamation" className="text-xs" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;