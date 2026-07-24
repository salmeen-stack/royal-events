import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import guestService from "../../services/guest.service";
import contributionService from "../../services/contribution.service";
import invitationService from "../../services/invitation.service";
import {
  formatCurrency,
  formatDate,
} from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

const GuestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [contribution, setContribution] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGuestData();
  }, [id]);

  const fetchGuestData = async () => {
    try {
      setIsLoading(true);
      const guestResponse = await guestService.getById(id);
      
      if (guestResponse.success) {
        setGuest(guestResponse.data);
        
        // Fetch contribution and invitation if they exist
        if (guestResponse.data.contributions && guestResponse.data.contributions.length > 0) {
          setContribution(guestResponse.data.contributions[0]);
        }
        
        if (guestResponse.data.invitations && guestResponse.data.invitations.length > 0) {
          setInvitation(guestResponse.data.invitations[0]);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner.Page text="Loading guest..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FontAwesomeIcon
          icon="circle-exclamation"
          className="text-4xl text-red-300"
        />
        <p className="text-gray-600">{error}</p>
        <Button variant="secondary" onClick={() => navigate("/guests")}>
          Back to Guests
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={guest?.name}
        subtitle={`${guest?.phone} | ${guest?.email || "No email"}`}
        icon="user"
        backPath="/guests"
        actions={
          <Badge 
            status={contribution?.status || "PENDING"} 
            size="lg" 
            dot 
          />
        }
      />

      {/* Guest Information */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title>
            <FontAwesomeIcon
              icon="circle-info"
              className="text-indigo-500 mr-2"
            />
            Guest Information
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Full Name
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Phone Number
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.phone}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.email || "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Category
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.category || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Event
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.event?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {guest?.notes || "No notes"}
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Contribution Information */}
      {contribution && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title>
              <FontAwesomeIcon
                icon="hand-holding-dollar"
                className="text-indigo-500 mr-2"
              />
              Contribution Details
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Expected Amount
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-0.5">
                  {formatCurrency(contribution.expectedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Paid Amount
                </p>
                <p className="text-lg font-semibold text-green-600 mt-0.5">
                  {formatCurrency(contribution.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Balance
                </p>
                <p className="text-lg font-semibold text-orange-600 mt-0.5">
                  {formatCurrency(contribution.balanceAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status:
                </span>
                <Badge status={contribution.status} size="sm" dot />
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Invitation Information */}
      {invitation && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title>
              <FontAwesomeIcon
                icon="envelope"
                className="text-indigo-500 mr-2"
              />
              Invitation Details
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Invitation Reference
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {invitation.invitationRef}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Channel
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {invitation.channel}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </p>
                <Badge status={invitation.status} size="sm" dot />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Sent At
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {invitation.sentAt ? formatDate(invitation.sentAt) : "Not sent"}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon="envelope"
              fullWidth
              onClick={() => navigate(`/invitations?guestId=${id}`)}
            >
              Send Invitation
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="hand-holding-dollar"
              fullWidth
              onClick={() => navigate(`/contributions?guestId=${id}`)}
            >
              Contribution
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="qrcode"
              fullWidth
              onClick={() => navigate(`/checkin?guestId=${id}`)}
            >
              Check-In
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="edit"
              fullWidth
              onClick={() => navigate(`/guests/${id}/edit`)}
            >
              Edit Guest
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default GuestDetail;