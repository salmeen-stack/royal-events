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
import reminderService from "../../services/reminder.service";
import eventService from "../../services/event.service";
import usePagination from "../../hooks/usePagination";
import { formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { REMINDER_TYPES } from "../../config/constants";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [sendingContrib, setSendingContrib] = useState(false);
  const [sendingEvent, setSendingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const pagination = usePagination();

  const [form, setForm] = useState({
    eventId: "",
    type: "",
    scheduledAt: "",
    message: "",
  });

  useEffect(() => {
    fetchReminders();
    fetchEvents();
  }, [pagination.page]);

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

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      const response = await reminderService.getAll(params);
      if (response.success) {
        setReminders(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch reminders error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.eventId || !form.type || !form.scheduledAt) {
      toast.error("Event, type and scheduled date are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const response = await reminderService.create(form);
      if (response.success) {
        toast.success("Reminder created!");
        setShowCreateModal(false);
        setForm({ eventId: "", type: "", scheduledAt: "", message: "" });
        fetchReminders();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendContributionReminders = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event.");
      return;
    }
    setSendingContrib(true);
    try {
      const response = await reminderService.sendContributionReminders(selectedEvent);
      if (response.success) toast.success(response.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingContrib(false);
    }
  };

  const handleSendEventReminders = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event.");
      return;
    }
    setSendingEvent(true);
    try {
      const response = await reminderService.sendEventReminders(selectedEvent);
      if (response.success) toast.success(response.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingEvent(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="Schedule and send reminders to guests"
        icon="clock"
        actions={
          <Button icon="plus" onClick={() => setShowCreateModal(true)}>
            Create Reminder
          </Button>
        }
      />

      {/* Quick Send Section */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title>
            <FontAwesomeIcon icon="paper-plane" className="text-indigo-500 mr-2" />
            Quick Send Reminders
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select
                options={events}
                placeholder="Select Event"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              />
            </div>
            <Button
              variant="warning"
              icon="hand-holding-dollar"
              isLoading={sendingContrib}
              onClick={handleSendContributionReminders}
            >
              Contribution Reminders
            </Button>
            <Button
              variant="primary"
              icon="calendar-days"
              isLoading={sendingEvent}
              onClick={handleSendEventReminders}
            >
              Event Reminders
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Reminders Table */}
      <Card animate={false}>
        {isLoading ? (
          <Spinner.Page text="Loading reminders..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Type</Table.Header>
                  <Table.Header>Scheduled</Table.Header>
                  <Table.Header>Sent At</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Message</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <Table.Row key={reminder.id}>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">
                          {reminder.event?.name}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={reminder.type} size="xs" />
                      </Table.Cell>
                      <Table.Cell>
                        {formatDateTime(reminder.scheduledAt)}
                      </Table.Cell>
                      <Table.Cell>
                        {reminder.sentAt
                          ? formatDateTime(reminder.sentAt)
                          : "Not yet"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={reminder.status === "SENT" ? "green" : "yellow"}
                          size="sm"
                          dot
                        >
                          {reminder.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-xs text-gray-500 max-w-xs truncate">
                          {reminder.message || "N/A"}
                        </p>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={6} message="No reminders found" icon="clock" />
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

      {/* Create Reminder Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Reminder"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button icon="check" isLoading={createLoading} onClick={handleCreate}>Create</Button>
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
          <Select
            label="Reminder Type"
            options={REMINDER_TYPES}
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            required
          />
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              rows={3}
              placeholder="Custom reminder message (optional)"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reminders;