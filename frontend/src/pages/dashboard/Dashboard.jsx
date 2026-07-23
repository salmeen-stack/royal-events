import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Stat from "../../components/ui/Stat";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import ContributionChart from "../../components/charts/ContributionChart";
import AttendanceChart from "../../components/charts/AttendanceChart";
import reportService from "../../services/report.service";
import useAuthStore from "../../store/authStore";
import { formatCurrency, formatDateShort } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await reportService.getSystemReport();
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
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

  const overview = data?.overview || {};
  const financial = data?.financial || {};
  const events = data?.events || {};

  const chartData = [
    { name: "Expected", expected: parseFloat(financial.totalExpected || 0), paid: 0 },
    { name: "Paid", expected: 0, paid: parseFloat(financial.totalPaid || 0) },
    { name: "Balance", expected: parseFloat(financial.totalBalance || 0), paid: 0 },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "User"}`}
        subtitle="Here is an overview of your events platform"
        icon="gauge"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          title="Total Events"
          value={overview.totalEvents || 0}
          icon="calendar-days"
          color="indigo"
          delay={0}
        />
        <Stat
          title="Total Guests"
          value={overview.totalGuests || 0}
          icon="users"
          color="blue"
          delay={0.1}
        />
        <Stat
          title="Total Revenue"
          value={formatCurrency(financial.totalRevenue || 0)}
          icon="hand-holding-dollar"
          color="green"
          delay={0.2}
        />
        <Stat
          title="Check-Ins"
          value={overview.totalCheckIns || 0}
          icon="circle-check"
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat
          title="Total Expected"
          value={formatCurrency(financial.totalExpected || 0)}
          icon="bullseye"
          color="indigo"
          delay={0.1}
        />
        <Stat
          title="Total Paid"
          value={formatCurrency(financial.totalPaid || 0)}
          icon="check-circle"
          color="green"
          delay={0.2}
        />
        <Stat
          title="Outstanding Balance"
          value={formatCurrency(financial.totalBalance || 0)}
          icon="clock"
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <Card.Header>
            <Card.Title>
              <FontAwesomeIcon
                icon="chart-area"
                className="text-indigo-500 mr-2"
              />
              Contribution Overview
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
              Attendance Overview
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <AttendanceChart
              checkedIn={overview.totalCheckIns || 0}
              total={overview.totalGuests || 0}
            />
          </Card.Content>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          title="Contributions"
          value={financial.totalContributions || 0}
          icon="receipt"
          color="blue"
          delay={0.1}
        />
        <Stat
          title="Successful Txns"
          value={financial.successfulTransactions || 0}
          icon="credit-card"
          color="green"
          delay={0.2}
        />
        <Stat
          title="Invitations"
          value={overview.totalInvitations || 0}
          icon="envelope"
          color="purple"
          delay={0.3}
        />
        <Stat
          title="Check-Ins"
          value={overview.totalCheckIns || 0}
          icon="qrcode"
          color="indigo"
          delay={0.4}
        />
      </div>

      {/* Recent Events */}
      <Card>
        <Card.Header>
          <Card.Title>
            <FontAwesomeIcon
              icon="calendar-days"
              className="text-indigo-500 mr-2"
            />
            Recent Events
          </Card.Title>
          <button
            onClick={() => navigate("/events")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View All
            <FontAwesomeIcon icon="arrow-right" className="text-xs" />
          </button>
        </Card.Header>
        <Card.Content>
          {events.recent && events.recent.length > 0 ? (
            <div className="space-y-3">
              {events.recent.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 bg-indigo-100 rounded-lg">
                      <FontAwesomeIcon
                        icon="calendar-day"
                        className="text-indigo-600 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.eventOwner?.name || "No owner"} &middot;{" "}
                        {formatDateShort(event.eventDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500">
                        <FontAwesomeIcon
                          icon="users"
                          className="mr-1 text-gray-400"
                        />
                        {event._count?.guests || 0} guests
                      </p>
                      <p className="text-xs text-gray-500">
                        <FontAwesomeIcon
                          icon="circle-check"
                          className="mr-1 text-gray-400"
                        />
                        {event._count?.checkIns || 0} check-ins
                      </p>
                    </div>
                    <Badge status={event.status} size="sm" dot />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <FontAwesomeIcon icon="calendar-xmark" className="text-3xl mb-2" />
              <p className="text-sm">No events yet</p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Dashboard;