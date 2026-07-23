import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

const Spinner = ({ size = "md", className = "", text = "" }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <FontAwesomeIcon
        icon="spinner"
        className={cn("animate-spin text-indigo-600", sizes[size])}
      />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
};

const PageSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" text={text} />
    </div>
  );
};

const FullPageSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="xl" text={text} />
    </div>
  );
};

Spinner.Page = PageSpinner;
Spinner.FullPage = FullPageSpinner;

export default Spinner;