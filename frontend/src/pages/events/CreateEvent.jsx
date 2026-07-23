import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Alert from "../../components/ui/Alert";
import eventService from "../../services/event.service";
import eventOwnerService from "../../services/eventOwner.service";
import { EVENT_TYPES } from "../../config/constants";
import { getErrorMessage } from "../../utils/helpers";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventOwners, setEventOwners] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    location: "",
    googleMapsUrl: "",
    contributionTarget: "",
    contributionDeadline: "",
    paymentInstructions: "",
    eventOwnerId: "",
  });

  useEffect(() => {
    fetchEventOwners();
  }, []);

  const fetchEventOwners = async () => {
    try {
      const response = await eventOwnerService.getAll({ limit: 100 });
      if (response.success) {
        setEventOwners(
          response.data.map((owner) => ({
            value: owner.id,
            label: `${owner.name} (${owner.phone})`,
          }))
        );
      }
    } catch (err) {
      console.error("Fetch event owners error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.type ||
      !formData.eventDate ||
      !formData.eventTime ||
      !formData.venue ||
      !formData.location ||
      !formData.eventOwnerId
    ) {
      setError(
        "Please fill in all required fields: Name, Type, Date, Time, Venue, Location and Event Owner."
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        contributionTarget: formData.contributionTarget
          ? parseFloat(formData.contributionTarget)
          : 0,
      };

      const response = await eventService.create(payload);
      if (response.success) {
        toast.success("Event created successfully!");
        navigate(`/events/${response.data.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Event"
        subtitle="Set up a new event"
        icon="calendar-plus"
        backPath="/events"
      />

      <Card animate={false}>
        <Alert
          type="error"
          message={error}
          show={!!error}
          onClose={() => setError("")}
          className="mb-4"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Owner */}
          <Select
            label="Event Owner"
            name="eventOwnerId"
            options={eventOwners}
            placeholder="Select event owner"
            value={formData.eventOwnerId}
            onChange={handleChange}
            required
          />

          {/* Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Name"
              name="name"
              placeholder="e.g. John & Mary's Wedding"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Select
              label="Event Type"
              name="type"
              options={EVENT_TYPES}
              placeholder="Select type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Date"
              name="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={handleChange}
              required
            />
            <Input
              label="Event Time"
              name="eventTime"
              type="time"
              value={formData.eventTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Venue"
              name="venue"
              placeholder="e.g. Serena Hotel"
              value={formData.venue}
              onChange={handleChange}
              required
            />
            <Input
              label="Location"
              name="location"
              placeholder="e.g. Dar es Salaam"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Google Maps URL"
            name="googleMapsUrl"
            icon="map-location-dot"
            placeholder="https://maps.google.com/..."
            value={formData.googleMapsUrl}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Enter event description..."
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          {/* Financial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contribution Target (TZS)"
              name="contributionTarget"
              type="number"
              icon="hand-holding-dollar"
              placeholder="e.g. 20000000"
              value={formData.contributionTarget}
              onChange={handleChange}
            />
            <Input
              label="Contribution Deadline"
              name="contributionDeadline"
              type="date"
              value={formData.contributionDeadline}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Instructions
            </label>
            <textarea
              name="paymentInstructions"
              rows={2}
              placeholder="Enter payment instructions for guests..."
              value={formData.paymentInstructions}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => navigate("/events")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon="check"
              isLoading={isLoading}
            >
              Create Event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateEvent;