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
import useAuthStore from "../../store/authStore";

const Guests = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

  const canAddGuest = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    expectedContribution: "",
    requiresInvitation: true,
  });
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [isImportMode, setIsImportMode] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

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
          requiresInvitation: true,
        });
        fetchGuests();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV file is empty or has no data");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          if (row.name && row.phone) {
            data.push(row);
          }
        }

        setCsvData(data);
        toast.success(`Loaded ${data.length} guests from CSV`);
      };
      reader.onerror = () => {
        toast.error("Error reading CSV file");
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }

    if (csvData.length === 0) {
      toast.error("No CSV data to import");
      return;
    }

    setImportLoading(true);

    try {
      const guests = csvData.map((row) => ({
        name: row.name || row.Name || "",
        phone: row.phone || row.Phone || "",
        email: row.email || row.Email || "",
        category: row.category || row.Category || "",
        expectedContribution: row.expectedContribution || row.ExpectedContribution || 0,
        requiresInvitation: row.requiresInvitation !== undefined 
          ? row.requiresInvitation === "true" || row.requiresInvitation === true 
          : true,
        notes: row.notes || row.Notes || "",
      }));

      const response = await guestService.bulkImport({
        eventId: selectedEvent,
        guests,
      });

      if (response.success) {
        toast.success(
          `Import completed: ${response.data.success} successful, ${response.data.failed} failed`
        );
        if (response.data.errors && response.data.errors.length > 0) {
          console.error("Import errors:", response.data.errors);
        }
        setShowAddModal(false);
        setCsvFile(null);
        setCsvData([]);
        setIsImportMode(false);
        fetchGuests();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImportLoading(false);
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
          canAddGuest && (
            <Button
              icon="user-plus"
              onClick={() => setShowAddModal(true)}
              disabled={!selectedEvent}
            >
              Add Guest
            </Button>
          )
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
        onClose={() => {
          setShowAddModal(false);
          setIsImportMode(false);
          setCsvFile(null);
          setCsvData([]);
        }}
        title={isImportMode ? "Import Guests from CSV" : "Add New Guest"}
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddModal(false);
                setIsImportMode(false);
                setCsvFile(null);
                setCsvData([]);
              }}
            >
              Cancel
            </Button>
            {isImportMode ? (
              <Button
                icon="upload"
                isLoading={importLoading}
                onClick={handleBulkImport}
              >
                Import Guests
              </Button>
            ) : (
              <Button
                icon="check"
                isLoading={addLoading}
                onClick={handleAddGuest}
              >
                Add Guest
              </Button>
            )}
          </>
        }
      >
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={!isImportMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsImportMode(false)}
          >
            Single Guest
          </Button>
          <Button
            variant={isImportMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsImportMode(true)}
          >
            CSV Import
          </Button>
        </div>

        {!isImportMode ? (
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresInvitation"
                checked={guestForm.requiresInvitation}
                onChange={(e) =>
                  setGuestForm((prev) => ({
                    ...prev,
                    requiresInvitation: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="requiresInvitation" className="text-sm text-gray-700">
                Send invitation with QR code after payment
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-700 mb-2">
                Your CSV should have the following headers (case-insensitive):
              </p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                name, phone, email, category, expectedContribution, requiresInvitation, notes
              </code>
              <p className="text-xs text-blue-600 mt-2">
                Only name and phone are required. requiresInvitation should be true/false.
              </p>
            </div>
            
            <Input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              label="Select CSV File"
            />
            
            {csvData.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Preview ({csvData.length} guests)
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <table className="text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 px-2">Name</th>
                        <th className="text-left py-1 px-2">Phone</th>
                        <th className="text-left py-1 px-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-1 px-2">{row.name || row.Name || '-'}</td>
                          <td className="py-1 px-2">{row.phone || row.Phone || '-'}</td>
                          <td className="py-1 px-2">{row.category || row.Category || '-'}</td>
                        </tr>
                      ))}
                      {csvData.length > 5 && (
                        <tr>
                          <td colSpan="3" className="py-1 px-2 text-gray-500">
                            ... and {csvData.length - 5} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Guests;