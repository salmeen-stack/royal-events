import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Stat from "../../components/ui/Stat";
import Spinner from "../../components/ui/Spinner";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import reportService from "../../services/report.service";
import eventService from "../../services/event.service";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage, downloadCSV } from "../../utils/helpers";

const Reports = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || "";
  const [selectedEvent, setSelectedEvent] = useState(eventIdParam);
  const [events, setEvents] = useState([]);
  const [reportType, setReportType] = useState("financial");
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const reportTypes = [
    { value: "financial", label: "Financial Report" },
    { value: "guests", label: "Guest Report" },
    { value: "invitations", label: "Invitation Report" },
    { value: "attendance", label: "Attendance Report" },
    { value: "complete", label: "Complete Report" },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchReport();
    }
  }, [selectedEvent, reportType]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 100 });
      if (response.success) {
        setEvents(
          response.data.map((e) => ({ value: e.id, label: e.name }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setReportData(null);
      let response;

      switch (reportType) {
        case "financial":
          response = await reportService.getEventFinancialReport(selectedEvent);
          break;
        case "guests":
          response = await reportService.getEventGuestReport(selectedEvent);
          break;
        case "invitations":
          response = await reportService.getEventInvitationReport(selectedEvent);
          break;
        case "attendance":
          response = await reportService.getEventAttendanceReport(selectedEvent);
          break;
        case "complete":
          response = await reportService.getCompleteEventReport(selectedEvent);
          break;
        default:
          response = await reportService.getEventFinancialReport(selectedEvent);
      }

      if (response.success) {
        setReportData(response.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;
    downloadCSV(
      [reportData],
      `royal-events-${reportType}-report-${Date.now()}`
    );
    toast.success("Report downloaded!");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download event reports"
        icon="chart-bar"
        actions={
          reportData && (
            <Button icon="download" variant="secondary" onClick={handleDownload}>
              Download CSV
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6" animate={false}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select
              options={events}
              placeholder="Select Event"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              options={reportTypes}
              placeholder="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
          </div>
          <Button icon="rotate-right" onClick={fetchReport} disabled={!selectedEvent}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Report Content */}
      {isLoading ? (
        <Spinner.Page text="Generating report..." />
      ) : reportData ? (
        <div className="space-y-6">
          {/* Event Info */}
          {reportData.event && (
            <Card>
              <Card.Header>
                <Card.Title>
                  <FontAwesomeIcon icon="calendar-days" className="text-indigo-500 mr-2" />
                  Event Information
                </Card.Title>
                <Badge status={reportData.event.status} size="sm" dot />
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Event Name</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{reportData.event.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(reportData.event.eventDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Venue</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {reportData.event.venue || "N/A"}
                    </p>
                  </div>
                  {reportData.event.eventOwner && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Event Owner</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {reportData.event.eventOwner.name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Reference</p>
                    <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">
                      {reportData.event.eventReference}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Generated At</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {new Date(reportData.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Financial Report */}
          {reportType === "financial" && reportData.contributions && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat
                  title="Contribution Target"
                  value={formatCurrency(reportData.event?.contributionTarget || 0)}
                  icon="bullseye"
                  color="indigo"
                  delay={0}
                />
                <Stat
                  title="Total Expected"
                  value={formatCurrency(reportData.contributions.totalExpected || 0)}
                  icon="hand-holding-dollar"
                  color="blue"
                  delay={0.1}
                />
                <Stat
                  title="Total Paid"
                  value={formatCurrency(reportData.contributions.totalPaid || 0)}
                  icon="check-circle"
                  color="green"
                  delay={0.2}
                />
                <Stat
                  title="Outstanding"
                  value={formatCurrency(reportData.contributions.totalBalance || 0)}
                  icon="clock"
                  color="orange"
                  delay={0.3}
                />
              </div>

              <Card>
                <Card.Header>
                  <Card.Title>
                    <FontAwesomeIcon icon="chart-pie" className="text-indigo-500 mr-2" />
                    Target Achievement
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div
                        className="bg-indigo-600 h-4 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(parseFloat(reportData.contributions.targetAchievement), 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-lg font-bold text-indigo-600 min-w-[60px]">
                      {reportData.contributions.targetAchievement}
                    </span>
                  </div>
                </Card.Content>
              </Card>
            </>
          )}

          {/* Guest Report */}
          {reportType === "guests" && reportData.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                title="Total Guests"
                value={reportData.summary.totalGuests}
                icon="users"
                color="blue"
                delay={0}
              />
              <Stat
                title="Paid"
                value={reportData.summary.paid}
                icon="user-check"
                color="green"
                delay={0.1}
              />
              <Stat
                title="Partial"
                value={reportData.summary.partial}
                icon="user-clock"
                color="orange"
                delay={0.2}
              />
              <Stat
                title="Unpaid"
                value={reportData.summary.unpaid}
                icon="user-xmark"
                color="red"
                delay={0.3}
              />
            </div>
          )}

          {/* Attendance Report */}
          {reportType === "attendance" && reportData.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                title="Total Guests"
                value={reportData.summary.totalGuests}
                icon="users"
                color="blue"
                delay={0}
              />
              <Stat
                title="Checked In"
                value={reportData.summary.totalCheckIns}
                icon="circle-check"
                color="green"
                delay={0.1}
              />
              <Stat
                title="Not Checked In"
                value={reportData.summary.notCheckedIn}
                icon="circle-xmark"
                color="red"
                delay={0.2}
              />
              <Stat
                title="Attendance Rate"
                value={reportData.summary.attendanceRate}
                icon="chart-line"
                color="indigo"
                delay={0.3}
              />
            </div>
          )}

          {/* Invitation Report */}
          {reportType === "invitations" && reportData.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Stat
                title="Total Invitations"
                value={reportData.summary.totalInvitations}
                icon="envelope"
                color="blue"
                delay={0}
              />
              <Stat
                title="Pending"
                value={reportData.pendingInvitations?.length || 0}
                icon="clock"
                color="yellow"
                delay={0.1}
              />
              <Stat
                title="Failed"
                value={reportData.failedInvitations?.length || 0}
                icon="circle-xmark"
                color="red"
                delay={0.2}
              />
            </div>
          )}

          {/* Complete Report */}
          {reportType === "complete" && reportData.stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Stat
                title="Total Guests"
                value={reportData.stats.totalGuests}
                icon="users"
                color="blue"
                delay={0}
              />
              <Stat
                title="Total Paid"
                value={formatCurrency(reportData.stats.financial?.totalPaid || 0)}
                icon="hand-holding-dollar"
                color="green"
                delay={0.1}
              />
              <Stat
                title="Total Check-Ins"
                value={reportData.stats.totalCheckIns}
                icon="circle-check"
                color="indigo"
                delay={0.2}
              />
              <Stat
                title="Invitations"
                value={reportData.stats.totalInvitations}
                icon="envelope"
                color="purple"
                delay={0.3}
              />
              <Stat
                title="Notifications"
                value={reportData.stats.totalNotifications}
                icon="bell"
                color="orange"
                delay={0.4}
              />
              <Stat
                title="Contributions"
                value={reportData.stats.financial?.totalContributions || 0}
                icon="receipt"
                color="gray"
                delay={0.5}
              />
            </div>
          )}
        </div>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
            <FontAwesomeIcon icon="chart-bar" className="text-5xl mb-4" />
            <p className="text-sm text-gray-500">
              Select an event and report type to generate a report
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default Reports;