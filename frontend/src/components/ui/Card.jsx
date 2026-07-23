import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

const Card = ({
  children,
  className = "",
  padding = "p-6",
  hover = false,
  animate = true,
  onClick,
}) => {
  const Component = animate ? motion.div : "div";
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Component
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        padding,
        hover && "hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer",
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
        "flex items-center justify-between pb-4 mb-4 border-b border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, icon, className = "" }) => {
  return (
    <h3 className={cn("text-base font-semibold text-gray-900 flex items-center gap-2", className)}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = "" }) => {
  return <div className={cn("", className)}>{children}</div>;
};

const CardFooter = ({ children, className = "" }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;