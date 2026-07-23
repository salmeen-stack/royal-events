import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Select from "../../components/ui/Select";
import transactionService from "../../services/transaction.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { TRANSACTION_STATUS } from "../../config/constants";

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || "";
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, debouncedSearch, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (eventIdParam) params.eventId = eventIdParam;

      const response = await transactionService.getAll(params);
      if (response.success) {
        setTransactions(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch transactions error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="View all payment transactions"
        icon="credit-card"
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search by reference, guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={TRANSACTION_STATUS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading transactions..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Reference</Table.Header>
                  <Table.Header>Guest</Table.Header>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Amount</Table.Header>
                  <Table.Header>Method</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Date</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {transactions.length > 0 ? (
                  transactions.map((txn) => (
                    <Table.Row key={txn.id}>
                      <Table.Cell>
                        <span className="font-mono text-xs">{txn.transactionRef}</span>
                        {txn.snippeRef && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Snippe: {txn.snippeRef}
                          </p>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">{txn.guest?.name}</p>
                        <p className="text-xs text-gray-500">{txn.guest?.phone}</p>
                      </Table.Cell>
                      <Table.Cell>{txn.event?.name}</Table.Cell>
                      <Table.Cell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(txn.amount)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{txn.paymentMethod || "N/A"}</Table.Cell>
                      <Table.Cell>
                        <Badge status={txn.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(txn.paidAt || txn.createdAt)}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={7} message="No transactions found" icon="credit-card" />
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

export default Transactions;