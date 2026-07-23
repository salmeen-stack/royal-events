import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Select from "../../components/ui/Select";
import contributionService from "../../services/contribution.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatCurrency, formatDateShort } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { CONTRIBUTION_STATUS } from "../../config/constants";
import useAuthStore from "../../store/authStore";

const Contributions = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || "";
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  const canManageContributions = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    fetchContributions();
  }, [pagination.page, debouncedSearch, statusFilter]);

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (eventIdParam) params.eventId = eventIdParam;

      const response = await contributionService.getAll(params);
      if (response.success) {
        setContributions(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch contributions error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (contributionId) => {
    try {
      const response = await contributionService.sendRequest(contributionId);
      if (response.success) {
        toast.success("Contribution request sent!");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSendBulkRequests = async () => {
    if (!eventIdParam) {
      toast.error("Please select an event first.");
      return;
    }
    setSendingBulk(true);
    try {
      const response = await contributionService.sendBulkRequests(eventIdParam);
      if (response.success) {
        toast.success(response.message);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Contributions"
        subtitle="Track guest contributions and payments"
        icon="hand-holding-dollar"
        actions={
          canManageContributions && eventIdParam && (
            <Button
              icon="paper-plane"
              variant="primary"
              isLoading={sendingBulk}
              onClick={handleSendBulkRequests}
            >
              Send Bulk Requests
            </Button>
          )
        }
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search by guest name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={CONTRIBUTION_STATUS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading contributions..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Guest</Table.Header>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Expected</Table.Header>
                  <Table.Header>Paid</Table.Header>
                  <Table.Header>Balance</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {contributions.length > 0 ? (
                  contributions.map((contrib) => (
                    <Table.Row key={contrib.id}>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">{contrib.guest?.name}</p>
                        <p className="text-xs text-gray-500">{contrib.guest?.phone}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-gray-700">{contrib.event?.name}</p>
                      </Table.Cell>
                      <Table.Cell>{formatCurrency(contrib.expectedAmount)}</Table.Cell>
                      <Table.Cell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(contrib.paidAmount)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(contrib.balanceAmount)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={contrib.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          {canManageContributions && contrib.status !== "PAID" && (
                            <button
                              onClick={() => handleSendRequest(contrib.id)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Send Reminder"
                            >
                              <FontAwesomeIcon icon="paper-plane" className="text-xs" />
                            </button>
                          )}
                          {contrib.contributionLink && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(contrib.contributionLink);
                                toast.success("Link copied!");
                              }}
                              className="p-1.5 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                              title="Copy Link"
                            >
                              <FontAwesomeIcon icon="copy" className="text-xs" />
                            </button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={7} message="No contributions found" icon="hand-holding-dollar" />
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

export default Contributions;