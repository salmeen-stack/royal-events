import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Spinner from "../../components/ui/Spinner";
import Select from "../../components/ui/Select";
import eventService from "../../services/event.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateShort, formatCurrency } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { EVENT_STATUS, EVENT_TYPES } from "../../config/constants";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, debouncedSearch, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await eventService.getAll(params);
      if (response.success) {
        setEvents(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch events error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Manage all your events"
        icon="calendar-days"
        actions={
          <Button
            icon="plus"
            onClick={() => navigate("/events/create")}
          >
            Create Event
          </Button>
        }
      />

      <Card animate={false}>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={EVENT_STATUS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={EVENT_TYPES}
              placeholder="All Types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Spinner.Page text="Loading events..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Type</Table.Header>
                  <Table.Header>Date</Table.Header>
                  <Table.Header>Guests</Table.Header>
                  <Table.Header>Target</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {events.length > 0 ? (
                  events.map((event) => (
                    <Table.Row
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {event.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.eventReference}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={event.type} size="sm" />
                      </Table.Cell>
                      <Table.Cell>
                        {formatDateShort(event.eventDate)}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon
                            icon="users"
                            className="text-gray-400 text-xs"
                          />
                          {event._count?.guests || 0}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {formatCurrency(event.contributionTarget)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={event.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}`);
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
                    message="No events found"
                    icon="calendar-xmark"
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

export default Events;