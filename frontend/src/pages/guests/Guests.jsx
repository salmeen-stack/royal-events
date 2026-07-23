import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import guestService from "../../services/guest.service";
import eventService from "../../services/event.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const Guests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(eventId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    expectedContribution: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [pagination.page, debouncedSearch, selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 100 });
      if (response.success) {
        setEvents(
          response.data.map((event) => ({
            value: event.id,
            label: event.name,
          }))
        );
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  };

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedEvent) params.eventId = selectedEvent;

      const response = await guestService.getAll(params);
      if (response.success) {
        setGuests(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch guests error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestForm.name || !guestForm.phone || !selectedEvent) {
      toast.error("Name, phone and event are required.");
      return;
    }

    setAddLoading(true);
    try {
      const response = await guestService.create({
        ...guestForm,
        eventId: selectedEvent,
        expectedContribution: guestForm.expectedContribution
          ? parseFloat(guestForm.expectedContribution)
          : 0,
      });

      if (response.success) {
        toast.success("Guest added successfully!");
        setShowAddModal(false);
        setGuestForm({
          name: "",
          phone: "",
          email: "",
          category: "",
          expectedContribution: "",
        });
        fetchGuests();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const getContributionStatus = (guest) => {
    if (guest.contributions && guest.contributions.length > 0) {
      return guest.contributions[0].status;
    }
    return "PENDING";
  };

  return (
    <div>
      <PageHeader
        title="Guests"
        subtitle="Manage event guests"
        icon="users"
        actions={
          <Button
            icon="user-plus"
            onClick={() => setShowAddModal(true)}
            disabled={!selectedEvent}
          >
            Add Guest
          </Button>
        }
      />

      <Card animate={false}>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={events}
              placeholder="All Events"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Spinner.Page text="Loading guests..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Guest</Table.Header>
                  <Table.Header>Phone</Table.Header>
                  <Table.Header>Category</Table.Header>
                  <Table.Header>Expected</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Invitation</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {guests.length > 0 ? (
                  guests.map((guest) => (
                    <Table.Row
                      key={guest.id}
                      onClick={() => navigate(`/guests/${guest.id}`)}
                    >
                      <Table.Cell>
                        <p className="font-medium text-gray-900">
                          {guest.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {guest.event?.name}
                        </p>
                      </Table.Cell>
                      <Table.Cell>{guest.phone}</Table.Cell>
                      <Table.Cell>
                        {guest.category || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {formatCurrency(guest.expectedContribution)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          status={getContributionStatus(guest)}
                          size="sm"
                          dot
                        />
                      </Table.Cell>
                      <Table.Cell>
                        {guest.invitations && guest.invitations.length > 0 ? (
                          <Badge
                            status={guest.invitations[0].status}
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not sent
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/guests/${guest.id}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <FontAwesomeIcon icon="arrow-right" />
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty
                    colSpan={7}
                    message="No guests found"
                    icon="users-slash"
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

      {/* Add Guest Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Guest"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              icon="check"
              isLoading={addLoading}
              onClick={handleAddGuest}
            >
              Add Guest
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter guest name"
            value={guestForm.name}
            onChange={(e) =>
              setGuestForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <Input
            label="Phone Number"
            placeholder="+2557XXXXXXXX"
            value={guestForm.phone}
            onChange={(e) =>
              setGuestForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="guest@email.com"
            value={guestForm.email}
            onChange={(e) =>
              setGuestForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Input
            label="Category"
            placeholder="e.g. Family, Friend, Colleague"
            value={guestForm.category}
            onChange={(e) =>
              setGuestForm((prev) => ({ ...prev, category: e.target.value }))
            }
          />
          <Input
            label="Expected Contribution (TZS)"
            type="number"
            placeholder="e.g. 100000"
            value={guestForm.expectedContribution}
            onChange={(e) =>
              setGuestForm((prev) => ({
                ...prev,
                expectedContribution: e.target.value,
              }))
            }
          />
        </div>
      </Modal>
    </div>
  );
};

export default Guests;