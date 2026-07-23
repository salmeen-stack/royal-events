import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import api from "../../config/api";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, debouncedSearch]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      const response = await api.get("/audit", { params });
      if (response.data.success) {
        setLogs(response.data.data);
        pagination.updatePagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Fetch audit logs error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities"
        icon="shield-halved"
      />

      <Card animate={false}>
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading audit logs..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Action</Table.Header>
                  <Table.Header>Module</Table.Header>
                  <Table.Header>User</Table.Header>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>IP Address</Table.Header>
                  <Table.Header>Date</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <Table.Row key={log.id}>
                      <Table.Cell>
                        <p className="text-sm font-medium text-gray-900">
                          {log.action}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="indigo" size="xs">
                          {log.module}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-gray-700">{log.user?.name || "System"}</p>
                        <p className="text-xs text-gray-400">{log.user?.role}</p>
                      </Table.Cell>
                      <Table.Cell>
                        {log.event?.name || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs font-mono text-gray-500">
                          {log.ipAddress || "N/A"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty
                    colSpan={6}
                    message="No audit logs found"
                    icon="shield-halved"
                  />
                )}
              </Table.Body>
            </Table>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={pagination.goToPage}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;