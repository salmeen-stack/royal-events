import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import invitationService from "../../services/invitation.service";
import { formatDate } from "../../utils/formatters";
import { APP_NAME } from "../../config/constants";
import logo from "../../assets/logo.png";

const VerifyPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setIsLoading(true);
      const response = await invitationService.verifyQR(token);
      if (response.success) {
        setData(response.data);
        setStatus("valid");
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.alreadyCheckedIn) {
        setData(errorData.errors);
        setStatus("already");
      } else {
        setStatus("invalid");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FontAwesomeIcon icon="spinner" className="text-3xl text-indigo-600 animate-spin" />
          <p className="text-sm text-gray-500">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        className="max-w-sm w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg overflow-hidden border border-gray-200">
              <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-gray-900">{APP_NAME}</span>
          </div>
        </div>

        {/* Valid */}
        {status === "valid" && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-green-300 overflow-hidden">
            <div className="bg-green-600 px-6 py-5 text-center">
              <FontAwesomeIcon icon="circle-check" className="text-white text-4xl mb-2" />
              <h2 className="text-white text-xl font-bold">VALID INVITATION</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Guest</span>
                <span className="text-sm font-bold text-gray-900">{data?.guest?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Event</span>
                <span className="text-sm font-medium text-gray-900">{data?.event?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(data?.event?.eventDate)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Venue</span>
                <span className="text-sm font-medium text-gray-900">{data?.event?.venue}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Check-In</span>
                <span className="text-sm font-medium text-green-600">NOT CHECKED IN</span>
              </div>
            </div>
          </div>
        )}

        {/* Already Checked In */}
        {status === "already" && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-red-300 overflow-hidden">
            <div className="bg-red-600 px-6 py-5 text-center">
              <FontAwesomeIcon icon="triangle-exclamation" className="text-white text-4xl mb-2" />
              <h2 className="text-white text-xl font-bold">ALREADY CHECKED IN</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Guest</span>
                <span className="text-sm font-bold text-gray-900">{data?.guest?.name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Method</span>
                <span className="text-sm font-medium text-gray-900">
                  {data?.checkInDetails?.method}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Invalid */}
        {status === "invalid" && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
            <div className="bg-gray-600 px-6 py-5 text-center">
              <FontAwesomeIcon icon="circle-xmark" className="text-white text-4xl mb-2" />
              <h2 className="text-white text-xl font-bold">INVALID INVITATION</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                This QR code is not valid. Please contact the event organizer.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by {APP_NAME}
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyPage;