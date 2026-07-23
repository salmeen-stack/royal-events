// ==========================================
// FORMAT CURRENCY
// ==========================================

export const formatCurrency = (amount, currency = "TZS") => {
  if (amount === null || amount === undefined) return `${currency} 0`;
  return `${currency} ${parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// ==========================================
// FORMAT DATE
// ==========================================

export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ==========================================
// FORMAT DATE SHORT
// ==========================================

export const formatDateShort = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// FORMAT DATE TIME
// ==========================================

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================
// FORMAT TIME AGO
// ==========================================

export const formatTimeAgo = (date) => {
  if (!date) return "N/A";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(date);
};

// ==========================================
// FORMAT PHONE
// ==========================================

export const formatPhone = (phone) => {
  if (!phone) return "N/A";
  return phone;
};

// ==========================================
// FORMAT PERCENTAGE
// ==========================================

export const formatPercentage = (value, total) => {
  if (!total || total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

// ==========================================
// TRUNCATE TEXT
// ==========================================

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// ==========================================
// GET STATUS COLOR CLASS
// ==========================================

export const getStatusColor = (status) => {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PARTIAL: "bg-orange-100 text-orange-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    SUCCESSFUL: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    REVERSED: "bg-gray-100 text-gray-700",
    DRAFT: "bg-gray-100 text-gray-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
    SENT: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    PROCESSED: "bg-green-100 text-green-700",
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    STAFF: "bg-blue-100 text-blue-700",
    EVENT_OWNER: "bg-indigo-100 text-indigo-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

// ==========================================
// GET DAYS UNTIL EVENT
// ==========================================

export const getDaysUntilEvent = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diffTime = event.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Event passed";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays} days away`;
};