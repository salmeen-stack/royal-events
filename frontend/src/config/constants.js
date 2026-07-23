export const APP_NAME = "Royal Events";
export const APP_VERSION = "1.0.0";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "STAFF",
  EVENT_OWNER: "EVENT_OWNER",
};

export const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding Ceremony" },
  { value: "BIRTHDAY", label: "Birthday Celebration" },
  { value: "GRADUATION", label: "Graduation Ceremony" },
  { value: "RELIGIOUS", label: "Religious Ceremony" },
  { value: "FUNDRAISING", label: "Fundraising Event" },
  { value: "CORPORATE", label: "Corporate Event" },
  { value: "OTHER", label: "Other" },
];

export const EVENT_STATUS = [
  { value: "DRAFT", label: "Draft", color: "gray" },
  { value: "ACTIVE", label: "Active", color: "green" },
  { value: "COMPLETED", label: "Completed", color: "blue" },
  { value: "CANCELLED", label: "Cancelled", color: "red" },
];

export const CONTRIBUTION_STATUS = [
  { value: "PENDING", label: "Pending", color: "yellow" },
  { value: "PARTIAL", label: "Partial", color: "orange" },
  { value: "PAID", label: "Paid", color: "green" },
  { value: "OVERDUE", label: "Overdue", color: "red" },
];

export const TRANSACTION_STATUS = [
  { value: "PENDING", label: "Pending", color: "yellow" },
  { value: "SUCCESSFUL", label: "Successful", color: "green" },
  { value: "FAILED", label: "Failed", color: "red" },
  { value: "REVERSED", label: "Reversed", color: "gray" },
];

export const INVITATION_CHANNELS = [
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "BOTH", label: "Both SMS & WhatsApp" },
];

export const INVITATION_STATUS = [
  { value: "PENDING", label: "Pending", color: "yellow" },
  { value: "SENT", label: "Sent", color: "blue" },
  { value: "DELIVERED", label: "Delivered", color: "green" },
  { value: "FAILED", label: "Failed", color: "red" },
];

export const CHECKIN_METHODS = [
  { value: "QR_SCAN", label: "QR Scan" },
  { value: "SMS_TOKEN", label: "SMS Token" },
  { value: "MANUAL", label: "Manual" },
];

export const REMINDER_TYPES = [
  { value: "CONTRIBUTION_REMINDER", label: "Contribution Reminder" },
  { value: "EVENT_REMINDER", label: "Event Reminder" },
  { value: "CHECKIN_REMINDER", label: "Check-In Reminder" },
];

export const PAYOUT_STATUS = [
  { value: "PENDING", label: "Pending", color: "yellow" },
  { value: "PROCESSED", label: "Processed", color: "green" },
  { value: "FAILED", label: "Failed", color: "red" },
];

export const USER_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "EVENT_OWNER", label: "Event Owner" },
];

export const NOTIFICATION_TYPES = [
  { value: "CONTRIBUTION_REQUEST", label: "Contribution Request" },
  { value: "CONTRIBUTION_REMINDER", label: "Contribution Reminder" },
  { value: "PAYMENT_CONFIRMATION", label: "Payment Confirmation" },
  { value: "INVITATION", label: "Invitation" },
  { value: "EVENT_REMINDER", label: "Event Reminder" },
  { value: "CHECKIN_REMINDER", label: "Check-In Reminder" },
];

export const NOTIFICATION_CHANNELS = [
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
];