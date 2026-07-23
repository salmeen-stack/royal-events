import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Stat from "../../components/ui/Stat";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import ContributionChart from "../../components/charts/ContributionChart";
import AttendanceChart from "../../components/charts/AttendanceChart";
import eventService from "../../services/event.service";
import reportService from "../../services/report.service";
import useAuthStore from "../../store/authStore";
import { formatCurrency, formatDateShort, formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const EventOwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchDashboardData();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching events for event owner dashboard...");
      const response = await eventService.getAll();
      console.log("Events response:", response);
      if (response.success) {
        setEvents(response.data);
        console.log("Events data:", response.data);
        if (response.data.length > 0) {
          setSelectedEvent(response.data[0]);
        }
      } else {
        console.error("Events fetch failed:", response.message);
        setError(response.message || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Fetch events error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedEvent) return;
    try {
      const response = await reportService.getCompleteEventReport(selectedEvent.id);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDownloadReport = async (reportType) => {
    if (!selectedEvent) return;
    try {
      let response;
      switch (reportType) {
        case "financial":
          response = await reportService.getEventFinancialReport(selectedEvent.id);
          break;
        case "guest":
          response = await reportService.getEventGuestReport(selectedEvent.id);
          break;
        case "invitation":
          response = await reportService.getEventInvitationReport(selectedEvent.id);
          break;
        case "attendance":
          response = await reportService.getEventAttendanceReport(selectedEvent.id);
          break;
        default:
          return;
      }
      if (response.success) {
        // Download logic would go here
        console.log("Report downloaded:", response.data);
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isLoading) {
    return <Spinner.Page text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FontAwesomeIcon
          icon="circle-exclamation"
          className="text-4xl text-red-300"
        />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FontAwesomeIcon icon="calendar-xmark" className="text-4xl text-gray-300" />
        <p className="text-gray-600">No events found</p>
        <p className="text-sm text-gray-500">Contact admin to create an event for you</p>
      </div>
    );
  }

  const data = dashboardData || {};
  const overview = data.overview || {};
  const financial = data.financial || {};
  const guests = data.guests || [];
  const transactions = data.transactions || [];
  const invitations = data.invitations || [];

  const chartData = [
    { name: "Expected", expected: parseFloat(financial.totalExpected || 0), paid: 0 },
    { name: "Paid", expected: 0, paid: parseFloat(financial.totalPaid || 0) },
    { name: "Balance", expected: parseFloat(financial.totalBalance || 0), paid: 0 },
  ];

  const progressPercentage = financial.totalExpected > 0 
    ? ((financial.totalPaid / financial.totalExpected) * 100).toFixed(1)
    : 0;

  const daysUntilEvent = selectedEvent.eventDate 
    ? Math.ceil((new Date(selectedEvent.eventDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/30"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user?.name?.split(" ")[0] || "Event Owner"} 👋
              </h1>
              <p className="text-white/80 text-lg">
                Here's what's happening with your events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{events.length}</div>
                <div className="text-sm text-white/70">Total Events</div>
              </div>
              <div className="h-12 w-px bg-white/30" />
              <div className="text-center">
                <div className="text-4xl font-bold">{overview.totalGuests || 0}</div>
                <div className="text-sm text-white/70">Total Guests</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Event Selector */}
      <Card variant="elevated">
        <Card.Content>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Event</label>
              <select
                value={selectedEvent?.id || ""}
                onChange={(e) => {
                  const event = events.find(ev => ev.id === e.target.value);
                  setSelectedEvent(event);
                }}
                className="w-full sm:w-80 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {formatDateShort(event.eventDate)}
                  </option>
                ))}
              </select>
            </div>
            {selectedEvent && (
              <div className="flex items-center gap-4">
                <Badge status={selectedEvent.status} size="lg" />
                <div className="text-sm text-gray-600 font-medium">
                  <FontAwesomeIcon icon="calendar" className="mr-2 text-indigo-500" />
                  {daysUntilEvent > 0 ? `${daysUntilEvent} days until event` : 
                    daysUntilEvent === 0 ? "Event today 🎉" : "Event passed"}
                </div>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {selectedEvent && (
        <>
          {/* Event Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="calendar-days" className="text-indigo-500 mr-2" />
                  Event Overview
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">Event Name</p>
                    <p className="font-bold text-gray-900">{selectedEvent.name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 mb-1">Date & Time</p>
                    <p className="font-bold text-gray-900">{formatDateTime(selectedEvent.eventDate)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">Venue</p>
                    <p className="font-bold text-gray-900">{selectedEvent.venue || "TBD"}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-600 mb-1">Location</p>
                    <p className="font-bold text-gray-900">{selectedEvent.location || "TBD"}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Stat
              title="Total Guests"
              value={overview.totalGuests || 0}
              icon="users"
              color="blue"
              delay={0}
            />
            <Stat
              title="Paid Guests"
              value={overview.paidGuests || 0}
              icon="check-circle"
              color="green"
              delay={0.1}
            />
            <Stat
              title="Unpaid Guests"
              value={overview.unpaidGuests || 0}
              icon="clock"
              color="orange"
              delay={0.2}
            />
            <Stat
              title="Invited Guests"
              value={overview.invitedGuests || 0}
              icon="envelope"
              color="purple"
              delay={0.3}
            />
          </motion.div>

          {/* Financial Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          >
            <Stat
              title="Contribution Target"
              value={formatCurrency(financial.targetAmount || 0)}
              icon="bullseye"
              color="indigo"
              delay={0.1}
            />
            <Stat
              title="Total Pledged"
              value={formatCurrency(financial.totalPledged || 0)}
              icon="hand-holding-dollar"
              color="blue"
              delay={0.2}
            />
            <Stat
              title="Total Paid"
              value={formatCurrency(financial.totalPaid || 0)}
              icon="check-circle"
              color="green"
              delay={0.3}
            />
            <Stat
              title="Outstanding"
              value={formatCurrency(financial.totalBalance || 0)}
              icon="clock"
              color="orange"
              delay={0.4}
            />
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated">
              <Card.Content>
                <div className="mb-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Contribution Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-1000"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="chart-area" className="text-indigo-500 mr-2" />
                  Contribution Overview
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <ContributionChart data={chartData} />
              </Card.Content>
            </Card>

            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="chart-pie" className="text-indigo-500 mr-2" />
                  Attendance Overview
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <AttendanceChart
                  checkedIn={overview.checkedIn || 0}
                  total={overview.totalGuests || 0}
                />
              </Card.Content>
            </Card>
          </motion.div>

          {/* Transaction Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="credit-card" className="text-indigo-500 mr-2" />
                  Recent Transactions
                </Card.Title>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/transactions")}
                >
                  View All
                </Button>
              </Card.Header>
              <Card.Content>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((txn, index) => (
                      <motion.div
                        key={txn.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-200">
                            <FontAwesomeIcon icon="check" className="text-white text-sm" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{txn.guest?.name || "Guest"}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(txn.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(txn.amount)}
                          </p>
                          <Badge status={txn.status} size="sm" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FontAwesomeIcon icon="credit-card" className="text-3xl mb-3" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          </motion.div>

          {/* Invitation Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="envelope" className="text-indigo-500 mr-2" />
                  Invitation Statistics
                </Card.Title>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/invitations")}
                >
                  View All
                </Button>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <p className="text-3xl font-bold text-indigo-600">{overview.totalInvitations || 0}</p>
                    <p className="text-xs font-semibold text-indigo-500 mt-1">Generated</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">{overview.invitationsSent || 0}</p>
                    <p className="text-xs font-semibold text-blue-500 mt-1">Sent</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <p className="text-3xl font-bold text-emerald-600">{overview.invitationsDelivered || 0}</p>
                    <p className="text-xs font-semibold text-emerald-500 mt-1">Delivered</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                    <p className="text-3xl font-bold text-red-600">{overview.invitationsFailed || 0}</p>
                    <p className="text-xs font-semibold text-red-500 mt-1">Failed</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Attendance Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="qrcode" className="text-indigo-500 mr-2" />
                  Attendance Statistics
                </Card.Title>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/checkin")}
                >
                  View Check-In
                </Button>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <p className="text-3xl font-bold text-emerald-600">{overview.checkedIn || 0}</p>
                    <p className="text-xs font-semibold text-emerald-500 mt-1">Checked In</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <p className="text-3xl font-bold text-amber-600">
                      {(overview.totalGuests || 0) - (overview.checkedIn || 0)}
                    </p>
                    <p className="text-xs font-semibold text-amber-500 mt-1">Not Checked In</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
                    <p className="text-3xl font-bold text-indigo-600">
                      {overview.totalGuests > 0 
                        ? ((overview.checkedIn / overview.totalGuests) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs font-semibold text-indigo-500 mt-1">Attendance Rate</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Download Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card variant="elevated">
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="file-download" className="text-indigo-500 mr-2" />
                  Download Reports
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    icon="file-invoice-dollar"
                    variant="secondary"
                    onClick={() => handleDownloadReport("financial")}
                    className="w-full"
                  >
                    Financial Report
                  </Button>
                  <Button
                    icon="users"
                    variant="secondary"
                    onClick={() => handleDownloadReport("guest")}
                    className="w-full"
                  >
                    Guest Report
                  </Button>
                  <Button
                    icon="envelope"
                    variant="secondary"
                    onClick={() => handleDownloadReport("invitation")}
                    className="w-full"
                  >
                    Invitation Report
                  </Button>
                  <Button
                    icon="qrcode"
                    variant="secondary"
                    onClick={() => handleDownloadReport("attendance")}
                    className="w-full"
                  >
                    Attendance Report
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default EventOwnerDashboard;
