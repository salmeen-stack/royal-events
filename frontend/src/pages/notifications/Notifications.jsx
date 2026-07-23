import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Select from "../../components/ui/Select";
import notificationService from "../../services/notification.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateTime, truncateText } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { NOTIFICATION_TYPES } from "../../config/constants";

const NOTIFICATION_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, debouncedSearch, typeFilter, statusFilter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await notificationService.getAll(params);
      if (response.success) {
        setNotifications(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch notifications error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="View all SMS and WhatsApp messages sent"
        icon="bell"
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={NOTIFICATION_TYPES}
              placeholder="All Types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={NOTIFICATION_STATUS_OPTIONS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading notifications..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Recipient</Table.Header>
                  <Table.Header>Type</Table.Header>
                  <Table.Header>Channel</Table.Header>
                  <Table.Header>Message</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Date</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <Table.Row key={notif.id}>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">
                          {notif.guest?.name || notif.recipient}
                        </p>
                        <p className="text-xs text-gray-500">{notif.recipient}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={notif.type} size="xs" />
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={notif.channel} size="sm" />
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-xs text-gray-600 max-w-xs truncate">
                          {truncateText(notif.message, 60)}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={notif.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(notif.sentAt || notif.createdAt)}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={6} message="No notifications found" icon="bell-slash" />
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

export default Notifications;