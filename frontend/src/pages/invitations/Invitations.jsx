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
import invitationService from "../../services/invitation.service";
import eventService from "../../services/event.service";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { INVITATION_STATUS, INVITATION_CHANNELS } from "../../config/constants";
import useAuthStore from "../../store/authStore";

const Invitations = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || "";
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [eventFilter, setEventFilter] = useState(eventIdParam);
  const [events, setEvents] = useState([]);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const debouncedSearch = useDebounce(search);
  const pagination = usePagination();

  const canManageInvitations = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [pagination.page, debouncedSearch, statusFilter, channelFilter, eventFilter]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 100 });
      if (response.success) {
        setEvents(response.data.map(e => ({ value: e.id, label: e.name })));
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  };

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.channel = channelFilter;
      if (eventFilter) params.eventId = eventFilter;

      const response = await invitationService.getAll(params);
      if (response.success) {
        setInvitations(response.data);
        pagination.updatePagination(response.pagination);
      }
    } catch (err) {
      console.error("Fetch invitations error:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (id) => {
    try {
      const response = await invitationService.send(id);
      if (response.success) {
        toast.success("Invitation sent via SMS!");
        fetchInvitations();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSendViaWhatsApp = (invitation) => {
    const { guest, event, invitationRef, qrToken } = invitation;
    
    // Format phone number (remove +, spaces, dashes)
    const cleanPhone = guest?.phone?.replace(/[\+\s\-]/g, '');
    
    if (!cleanPhone) {
      toast.error("Guest phone number not available");
      return;
    }

    const eventDate = new Date(event?.eventDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const invitationLink = `${window.location.origin}/invitation/${qrToken}`;

    const message =
      `💒 *Wedding Invitation*\n\n` +
      `Dear *${guest?.name}*,\n\n` +
      `You are officially invited to:\n\n` +
      `📌 *Event:* ${event?.name}\n` +
      `📅 *Date:* ${eventDate}\n` +
      `⏰ *Time:* ${event?.eventTime}\n` +
      `📍 *Venue:* ${event?.venue}\n` +
      `🗺️ *Location:* ${event?.location}\n\n` +
      `*Invitation Reference:* ${invitationRef}\n\n` +
      `🎁 *Click below to view your beautiful invitation card with your QR code:*\n` +
      `${invitationLink}\n\n` +
      `Present your QR code at the event entrance for check-in.\n\n` +
      `We look forward to celebrating with you! 🎊`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleBulkGenerate = async () => {
    if (!eventIdParam) {
      toast.error("Please filter by event first.");
      return;
    }
    setGeneratingBulk(true);
    try {
      const response = await invitationService.bulkGenerate({
        eventId: eventIdParam,
        channel: "SMS",
      });
      if (response.success) {
        toast.success("Bulk invitations generated!");
        fetchInvitations();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGeneratingBulk(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Invitations"
        subtitle="Manage digital invitations"
        icon="envelope"
        actions={
          canManageInvitations && eventIdParam && (
            <Button
              icon="envelopes-bulk"
              isLoading={generatingBulk}
              onClick={handleBulkGenerate}
            >
              Bulk Generate
            </Button>
          )
        }
      />

      <Card animate={false}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Input
              icon="magnifying-glass"
              placeholder="Search invitations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={events}
              placeholder="All Events"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={INVITATION_STATUS}
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={INVITATION_CHANNELS}
              placeholder="All Channels"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner.Page text="Loading invitations..." />
        ) : (
          <>
            <Table>
              <Table.Head>
                <tr>
                  <Table.Header>Guest</Table.Header>
                  <Table.Header>Event</Table.Header>
                  <Table.Header>Reference</Table.Header>
                  <Table.Header>Channel</Table.Header>
                  <Table.Header>SMS Token</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header>Sent</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </Table.Head>
              <Table.Body>
                {invitations.length > 0 ? (
                  invitations.map((inv) => (
                    <Table.Row key={inv.id}>
                      <Table.Cell>
                        <p className="font-medium text-gray-900">{inv.guest?.name}</p>
                        <p className="text-xs text-gray-500">{inv.guest?.phone}</p>
                      </Table.Cell>
                      <Table.Cell>{inv.event?.name}</Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-xs">{inv.invitationRef}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={inv.channel} size="sm" />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          {inv.smsToken}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge status={inv.status} size="sm" dot />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-gray-500">
                          {inv.sentAt ? formatDateTime(inv.sentAt) : "Not yet"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          {canManageInvitations && inv.status === "PENDING" && (
                            <button
                              onClick={() => handleSend(inv.id)}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Send via SMS"
                            >
                              <FontAwesomeIcon icon="paper-plane" className="text-xs" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSendViaWhatsApp(inv)}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                            title="Send via WhatsApp"
                          >
                            <FontAwesomeIcon icon="comment" className="text-xs" />
                          </button>
                          {inv.checkIn && (
                            <Badge color="green" size="xs" icon="circle-check">
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Empty colSpan={8} message="No invitations found" icon="envelope" />
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

export default Invitations;