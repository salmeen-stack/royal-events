import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to{" "}
        <span className="font-medium text-gray-700">{endItem}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-sm",
            "transition-all duration-200",
            hasPrevPage
              ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <FontAwesomeIcon icon="chevron-left" className="text-xs" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((pageNum, index) => (
          <button
            key={index}
            onClick={() => pageNum !== "..." && onPageChange(pageNum)}
            disabled={pageNum === "..."}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium",
              "transition-all duration-200",
              pageNum === page
                ? "bg-indigo-600 text-white"
                : pageNum === "..."
                ? "text-gray-400 cursor-default"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {pageNum}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-sm",
            "transition-all duration-200",
            hasNextPage
              ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              : "text-gray-300 cursor-not-allowed"
          )}
        >
          <FontAwesomeIcon icon="chevron-right" className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;