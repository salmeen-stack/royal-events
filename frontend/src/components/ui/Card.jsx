import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

const Card = ({
  children,
  className = "",
  padding = "p-6",
  hover = false,
  animate = true,
  onClick,
  variant = "default",
}) => {
  const Component = animate ? motion.div : "div";
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  const variantStyles = {
    default: "bg-white rounded-2xl border border-gray-200 shadow-sm",
    elevated: "bg-white rounded-2xl border-0 shadow-lg",
    glass: "bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border-0 shadow-lg text-white",
  };

  return (
    <Component
      className={cn(
        variantStyles[variant],
        padding,
        hover && "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...animateProps}
    >
      {children}
    </Component>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-5 mb-5 border-b border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, icon, className = "" }) => {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900 flex items-center gap-2", className)}>
      {children}
    </h3>
  );
};

const CardSubtitle = ({ children, className = "" }) => {
  return (
    <p className={cn("text-sm text-gray-500 mt-1", className)}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = "" }) => {
  return <div className={cn("", className)}>{children}</div>;
};

const CardFooter = ({ children, className = "" }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;