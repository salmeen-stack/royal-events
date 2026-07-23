import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const PageHeader = ({
  title,
  subtitle,
  icon,
  backPath,
  actions,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon="arrow-left" className="text-sm" />
          </button>
        )}
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <FontAwesomeIcon icon={icon} className="text-indigo-600 text-lg" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;