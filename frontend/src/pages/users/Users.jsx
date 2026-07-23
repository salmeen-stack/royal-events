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
import userService from "../../services/user.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { USER_ROLES } from "../../config/constants";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, debouncedSearch, roleFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      const response = await userService.getAll(params);
      if (response.success) {
        setUsers(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch users error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const response = await userService.create(form);
      if (response.success) {
        toast.success(response.message);
        setShowCreateModal(false);
        setForm({ name: "", email: "", phone: "", role: "STAFF" });
        fetchUsers();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await userService.toggleStatus(id);
      if (response.success) {
        toast.success(response.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="System Users"
        subtitle="Manage staff and admin accounts"
        icon="user-gear"
        actions={
          <Button icon="user-plus" onClick={() => setShowCreateModal(true)}>
            Add User
          </Button>
        }
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={USER_ROLES}
              placeholder="All Roles"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading users..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>User</Table.Header>
                  <Table.Header>Phone</Table.Header>
                  <Table.Header>Role</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Created</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {users.length > 0 ? (
                  users.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full text-indigo-600 text-xs font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{user.phone || "N/A"}</Table.Cell>
                      <Table.Cell>
                        <Badge status={user.role} size="sm" />
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={user.isActive ? "green" : "red"}
                          size="sm"
                          dot
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(user.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`text-xs font-medium flex items-center gap-1 ${
                            user.isActive
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={user.isActive ? "user-slash" : "user-check"}
                          />
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={6} message="No users found" icon="users" />
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button icon="check" isLoading={createLoading} onClick={handleCreate}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            type="email"
            icon="envelope"
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+2557XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <Select
            label="Role"
            options={USER_ROLES}
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <FontAwesomeIcon icon="info-circle" className="mr-1" />
            Default password: royalevent123
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Users;