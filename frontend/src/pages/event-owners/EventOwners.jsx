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
import Modal from "../../components/ui/Modal";
import eventOwnerService from "../../services/eventOwner.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const EventOwners = () => {
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchOwners();
  }, [pagination.page, debouncedSearch]);

  const fetchOwners = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await eventOwnerService.getAll(params);
      if (response.success) {
        setOwners(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch event owners error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", address: "" });
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Name, email and phone are required.");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await eventOwnerService.create(form);
      if (response.success) {
        toast.success("Event owner created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchOwners();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (owner) => {
    setSelectedOwner(owner);
    setForm({
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      address: owner.address || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Name, email and phone are required.");
      return;
    }

    setEditLoading(true);
    try {
      const response = await eventOwnerService.update(selectedOwner.id, form);
      if (response.success) {
        toast.success("Event owner updated successfully!");
        setShowEditModal(false);
        setSelectedOwner(null);
        resetForm();
        fetchOwners();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (owner) => {
    setSelectedOwner(owner);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await eventOwnerService.delete(selectedOwner.id);
      if (response.success) {
        toast.success("Event owner deleted successfully!");
        setShowDeleteModal(false);
        setSelectedOwner(null);
        fetchOwners();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await eventOwnerService.toggleStatus(id);
      if (response.success) {
        toast.success(response.message);
        fetchOwners();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div>
      <PageHeader
        title="Event Owners"
        subtitle="Manage event owners and organizers"
        icon="user-tie"
        actions={
          <Button icon="user-plus" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            Add Event Owner
          </Button>
        }
      />

      <Card animate={false}>
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Spinner.Page text="Loading event owners..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Owner</Table.Header>
                  <Table.Header>Phone</Table.Header>
                  <Table.Header>Address</Table.Header>
                  <Table.Header>Events</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Created</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {owners.length > 0 ? (
                  owners.map((owner) => (
                    <Table.Row key={owner.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 bg-indigo-100 rounded-full text-indigo-600 text-xs font-bold flex-shrink-0">
                            {getInitials(owner.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{owner.name}</p>
                            <p className="text-xs text-gray-500">{owner.email}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon="phone" className="text-gray-400 text-xs" />
                          <span>{owner.phone}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {owner.address || <span className="text-gray-400">N/A</span>}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon="calendar-days" className="text-gray-400 text-xs" />
                          <span className="font-medium">{owner._count?.events || 0}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={owner.isActive ? "green" : "red"}
                          size="sm"
                          dot
                        >
                          {owner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(owner.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(owner)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon="pen-to-square" className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(owner.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              owner.isActive
                                ? "text-orange-600 hover:bg-orange-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={owner.isActive ? "Deactivate" : "Activate"}
                          >
                            <FontAwesomeIcon
                              icon={owner.isActive ? "toggle-on" : "toggle-off"}
                              className="text-sm"
                            />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(owner)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon="trash-can" className="text-xs" />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty
                    colSpan={7}
                    message="No event owners found"
                    icon="user-tie"
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Add Event Owner"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button
              icon="check"
              isLoading={createLoading}
              onClick={handleCreate}
            >
              Create Owner
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            icon="user"
            placeholder="Enter full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            icon="envelope"
            type="email"
            placeholder="Enter email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Phone Number"
            icon="phone"
            placeholder="+2557XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <Input
            label="Address"
            icon="location-dot"
            placeholder="Enter address (optional)"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <FontAwesomeIcon icon="info-circle" className="mr-1" />
            Default password: royalevent123
          </p>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedOwner(null); resetForm(); }}
        title="Edit Event Owner"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowEditModal(false); setSelectedOwner(null); resetForm(); }}
            >
              Cancel
            </Button>
            <Button
              icon="check"
              isLoading={editLoading}
              onClick={handleUpdate}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            icon="user"
            placeholder="Enter full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            icon="envelope"
            type="email"
            placeholder="Enter email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Phone Number"
            icon="phone"
            placeholder="+2557XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <Input
            label="Address"
            icon="location-dot"
            placeholder="Enter address (optional)"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <FontAwesomeIcon icon="info-circle" className="mr-1" />
            Default password: royalevent123
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedOwner(null); }}
        title="Delete Event Owner"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowDeleteModal(false); setSelectedOwner(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon="trash-can"
              isLoading={deleteLoading}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon="triangle-exclamation" className="text-2xl text-red-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Are you sure?
          </h4>
          <p className="text-sm text-gray-500">
            You are about to delete <strong>{selectedOwner?.name}</strong>.
            This action cannot be undone.
          </p>
          {selectedOwner?._count?.events > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg w-full">
              <p className="text-sm text-yellow-700">
                <FontAwesomeIcon icon="circle-exclamation" className="mr-1" />
                This owner has {selectedOwner._count.events} event(s) and cannot be deleted.
                Deactivate instead.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EventOwners;
