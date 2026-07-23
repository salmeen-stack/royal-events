import { useState, useEffect } from "react";
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
import Modal from "../../components/ui/Modal";
import payoutService from "../../services/payout.service";
import eventService from "../../services/event.service";
import usePagination from "../../hooks/usePagination";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { PAYOUT_STATUS } from "../../config/constants";

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const pagination = usePagination();

  const [form, setForm] = useState({
    eventId: "",
    amount: "",
    fees: "",
    serviceFee: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayouts();
    fetchEvents();
  }, [pagination.page, statusFilter]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 100 });
      if (response.success) {
        setEvents(response.data.map((e) => ({ value: e.id, label: e.name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayouts = async () => {
    try {
      setIsLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      const response = await payoutService.getAll(params);
      if (response.success) {
        setPayouts(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch payouts error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.eventId || !form.amount) {
      toast.error("Event and amount are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const response = await payoutService.create({
        ...form,
        amount: parseFloat(form.amount),
        fees: parseFloat(form.fees || 0),
        serviceFee: parseFloat(form.serviceFee || 0),
      });
      if (response.success) {
        toast.success("Payout created successfully!");
        setShowCreateModal(false);
        setForm({ eventId: "", amount: "", fees: "", serviceFee: "", notes: "" });
        fetchPayouts();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleMarkProcessed = async (id) => {
    try {
      const response = await payoutService.updateStatus(id, { status: "PROCESSED" });
      if (response.success) {
        toast.success("Payout marked as processed!");
        fetchPayouts();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Payouts"
        subtitle="Manage event owner payouts"
        icon="money-bill-transfer"
        actions={
          <Button icon="plus" onClick={() => setShowCreateModal(true)}>
            Create Payout
          </Button>
        }
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1" />
          <div className="w-full sm:w-44">
            <Select
              options={PAYOUT_STATUS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading payouts..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Event Owner</Table.Header>
                  <Table.Header>Amount</Table.Header>
                  <Table.Header>Fees</Table.Header>
                  <Table.Header>Net Amount</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Date</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {payouts.length > 0 ? (
                  payouts.map((payout) => (
                    <Table.Row key={payout.id}>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">
                          {payout.event?.name}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        {payout.event?.eventOwner?.name || "N/A"}
                      </Table.Cell>
                      <Table.Cell>{formatCurrency(payout.amount)}</Table.Cell>
                      <Table.Cell>
                        <span className="text-red-600">
                          {formatCurrency(
                            parseFloat(payout.fees || 0) +
                              parseFloat(payout.serviceFee || 0)
                          )}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payout.netAmount)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={payout.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        {payout.payoutDate
                          ? formatDate(payout.payoutDate)
                          : "Pending"}
                      </Table.Cell>
                      <Table.Cell>
                        {payout.status === "PENDING" && (
                          <button
                            onClick={() => handleMarkProcessed(payout.id)}
                            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon="check" />
                            Process
                          </button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty
                    colSpan={8}
                    message="No payouts found"
                    icon="money-bill-transfer"
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

      {/* Create Payout Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button icon="check" isLoading={createLoading} onClick={handleCreate}>
              Create Payout
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Event"
            options={events}
            value={form.eventId}
            onChange={(e) => setForm((prev) => ({ ...prev, eventId: e.target.value }))}
            required
          />
          <Input
            label="Payout Amount (TZS)"
            type="number"
            icon="hand-holding-dollar"
            placeholder="Amount to pay out"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payment Fees (TZS)"
              type="number"
              placeholder="Provider fees"
              value={form.fees}
              onChange={(e) => setForm((prev) => ({ ...prev, fees: e.target.value }))}
            />
            <Input
              label="Service Fee (TZS)"
              type="number"
              placeholder="Royal Events fee"
              value={form.serviceFee}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceFee: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Optional notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Payouts;