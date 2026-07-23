import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Stat from "../../components/ui/Stat";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ContributionChart from "../../components/charts/ContributionChart";
import AttendanceChart from "../../components/charts/AttendanceChart";
import eventService from "../../services/event.service";
import {
  formatCurrency,
  formatDate,
  getDaysUntilEvent,
} from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      const [eventResponse, statsResponse] = await Promise.all([
        eventService.getById(id),
        eventService.getStats(id),
      ]);

      if (eventResponse.success) setEvent(eventResponse.data);
      if (statsResponse.success) setStats(statsResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner.Page text="Loading event..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FontAwesomeIcon
          icon="circle-exclamation"
          className="text-4xl text-red-300"
        />
        <p className="text-gray-600">{error}</p>
        <Button variant="secondary" onClick={() => navigate("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  const guests = stats?.guests || {};
  const financial = stats?.financial || {};
  const invitations = stats?.invitations || {};
  const attendance = stats?.attendance || {};

  const chartData = [
    {
      name: "Target",
      expected: parseFloat(financial.target || 0),
      paid: 0,
    },
    {
      name: "Expected",
      expected: parseFloat(financial.totalExpected || 0),
      paid: 0,
    },
    {
      name: "Paid",
      expected: 0,
      paid: parseFloat(financial.totalPaid || 0),
    },
  ];

  return (
    <div>
      <PageHeader
        title={event?.name}
        subtitle={`${event?.eventReference} | ${formatDate(event?.eventDate)} | ${event?.venue}`}
        icon="calendar-day"
        backPath="/events"
        actions={
          <div className="flex items-center gap-2">
            <Badge status={event?.status} size="lg" dot />
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <FontAwesomeIcon icon="clock" className="mr-1 text-gray-400" />
              {getDaysUntilEvent(event?.eventDate)}
            </span>
          </div>
        }
      />

      {/* Guest & Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          title="Total Guests"
          value={guests.total || 0}
          icon="users"
          color="blue"
          delay={0}
        />
        <Stat
          title="Paid Guests"
          value={guests.paid || 0}
          icon="user-check"
          color="green"
          delay={0.1}
        />
        <Stat
          title="Total Collected"
          value={formatCurrency(financial.totalPaid || 0)}
          icon="hand-holding-dollar"
          color="green"
          delay={0.2}
        />
        <Stat
          title="Outstanding"
          value={formatCurrency(financial.totalBalance || 0)}
          icon="clock"
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <Card.Header>
            <Card.Title>
              <FontAwesomeIcon
                icon="chart-area"
                className="text-indigo-500 mr-2"
              />
              Financial Overview
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ContributionChart data={chartData} />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>
              <FontAwesomeIcon
                icon="chart-pie"
                className="text-indigo-500 mr-2"
              />
              Attendance
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <AttendanceChart
              checkedIn={attendance.totalCheckIns || 0}
              total={guests.total || 0}
            />
          </Card.Content>
        </Card>
      </div>

      {/* Invitation & Check-In Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          title="Invitations Sent"
          value={invitations.sent || 0}
          icon="envelope"
          color="purple"
          delay={0}
        />
        <Stat
          title="Invitations Pending"
          value={invitations.pending || 0}
          icon="clock"
          color="yellow"
          delay={0.1}
        />
        <Stat
          title="Checked In"
          value={attendance.totalCheckIns || 0}
          icon="circle-check"
          color="green"
          delay={0.2}
        />
        <Stat
          title="Not Checked In"
          value={attendance.notCheckedIn || 0}
          icon="circle-xmark"
          color="red"
          delay={0.3}
        />
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title>
            <FontAwesomeIcon
              icon="bolt"
              className="text-indigo-500 mr-2"
            />
            Quick Actions
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon="user-plus"
              fullWidth
              onClick={() => navigate(`/guests?eventId=${id}`)}
            >
              Guests
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="hand-holding-dollar"
              fullWidth
              onClick={() => navigate(`/contributions?eventId=${id}`)}
            >
              Contributions
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="credit-card"
              fullWidth
              onClick={() => navigate(`/transactions?eventId=${id}`)}
            >
              Transactions
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="envelope"
              fullWidth
              onClick={() => navigate(`/invitations?eventId=${id}`)}
            >
              Invitations
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="qrcode"
              fullWidth
              onClick={() => navigate(`/checkin?eventId=${id}`)}
            >
              Check-In
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="chart-bar"
              fullWidth
              onClick={() => navigate(`/reports?eventId=${id}`)}
            >
              Reports
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Event Details */}
      <Card>
        <Card.Header>
          <Card.Title>
            <FontAwesomeIcon
              icon="circle-info"
              className="text-indigo-500 mr-2"
            />
            Event Details
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Event Owner
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.eventOwner?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contact
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.eventOwner?.phone || "N/A"} |{" "}
                  {event?.eventOwner?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Venue
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.venue}, {event?.location}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Google Maps
                </p>
                {event?.googleMapsUrl ? (
                  <a
                    href={event.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-0.5"
                  >
                    <FontAwesomeIcon icon="map-location-dot" className="text-xs" />
                    View on Map
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 mt-0.5">Not set</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contribution Target
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {formatCurrency(event?.contributionTarget || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contribution Deadline
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.contributionDeadline
                    ? formatDate(event.contributionDeadline)
                    : "No deadline set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.description || "No description"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Created By
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {event?.createdBy?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default EventDetail;