import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "../../utils/helpers";

const Table = ({ children, className = "" }) => {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-gray-200", className)}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
};

const TableHead = ({ children, className = "" }) => {
  return (
    <thead className={cn("bg-gray-50 border-b border-gray-200", className)}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = "" }) => {
  return <tbody className={cn("divide-y divide-gray-100", className)}>{children}</tbody>;
};

const TableRow = ({ children, className = "", onClick, highlight = false }) => {
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 transition-colors duration-150",
        onClick && "cursor-pointer",
        highlight && "bg-indigo-50 hover:bg-indigo-50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableHeader = ({ children, className = "", sortable = false, sorted, onSort }) => {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:text-gray-900",
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <FontAwesomeIcon
            icon={
              sorted === "asc"
                ? "sort-up"
                : sorted === "desc"
                ? "sort-down"
                : "sort"
            }
            className={cn(
              "text-[10px]",
              sorted ? "text-indigo-500" : "text-gray-400"
            )}
          />
        )}
      </div>
    </th>
  );
};

const TableCell = ({ children, className = "" }) => {
  return (
    <td className={cn("px-4 py-3.5 text-sm text-gray-700", className)}>
      {children}
    </td>
  );
};

const TableEmpty = ({ colSpan = 1, message = "No data found", icon = "inbox" }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <FontAwesomeIcon
            icon={icon}
            className="text-3xl text-gray-300"
          />
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </td>
    </tr>
  );
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;
Table.Empty = TableEmpty;

export default Table;