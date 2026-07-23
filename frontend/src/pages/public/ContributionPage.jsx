import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import guestService from "../../services/guest.service";
import transactionService from "../../services/transaction.service";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { APP_NAME } from "../../config/constants";
import logo from "../../assets/logo.png";

const ContributionPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchContributionData();
  }, [token]);

  const fetchContributionData = async () => {
    try {
      setIsLoading(true);
      const response = await guestService.getContributionPage(token);
      if (response.success) {
        setData(response.data);
        setAmount(response.data.contribution?.balanceAmount || "");
      }
    } catch (err) {
      setError("This contribution link is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await transactionService.initiatePayment({
        contributionId: data.contribution.id,
        amount: parseFloat(amount),
      });

      if (response.success) {
        if (response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
          return;
        }
        setSubmitted(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FontAwesomeIcon icon="spinner" className="text-3xl text-indigo-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <FontAwesomeIcon icon="circle-exclamation" className="text-4xl text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <FontAwesomeIcon icon="circle-check" className="text-3xl text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Initiated!
          </h2>
          <p className="text-sm text-gray-500">
            Your payment of {formatCurrency(amount)} has been initiated.
            You will receive a confirmation message shortly.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg overflow-hidden border border-gray-200">
              <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-gray-900">{APP_NAME}</span>
          </div>
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {data?.event?.imageUrl && (
            <div className="h-40 bg-indigo-600 overflow-hidden">
              <img
                src={data.event.imageUrl}
                alt={data.event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!data?.event?.imageUrl && (
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <FontAwesomeIcon icon="calendar-days" className="text-white text-4xl opacity-50" />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {data?.event?.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon="calendar" className="text-indigo-500" />
                {formatDate(data?.event?.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon="location-dot" className="text-indigo-500" />
                {data?.event?.venue}
              </span>
            </div>
            {data?.event?.description && (
              <p className="text-sm text-gray-600">{data.event.description}</p>
            )}
          </div>
        </div>

        {/* Contribution Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full text-indigo-600 text-sm font-bold">
              {data?.guest?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {data?.guest?.name}
              </p>
              <p className="text-xs text-gray-500">
                Expected: {formatCurrency(data?.contribution?.expectedAmount || 0)}
              </p>
            </div>
          </div>

          {data?.contribution?.paidAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                <FontAwesomeIcon icon="check-circle" className="mr-1" />
                You have paid {formatCurrency(data.contribution.paidAmount)}.
                Remaining: {formatCurrency(data.contribution.balanceAmount)}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contribution Amount (TZS)
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 text-lg font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon="spinner" className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon="credit-card" />
              )}
              {isSubmitting ? "Processing..." : `Pay ${amount ? formatCurrency(amount) : ""}`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by {APP_NAME}
        </p>
      </motion.div>
    </div>
  );
};

export default ContributionPage;