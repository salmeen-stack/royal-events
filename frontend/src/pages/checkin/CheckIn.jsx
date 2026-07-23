import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import checkinService from "../../services/checkin.service";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";
import { extractTokenFromQRValue } from "../../utils/qr";

const CheckIn = () => {
  const [mode, setMode] = useState("token");
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [result, setResult] = useState(null);
  const [guestPreview, setGuestPreview] = useState(null);
  const [error, setError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const tokenRef = useRef(null);
  const qrScannerRef = useRef(null);
  const qrRegionId = "qr-reader-region";

  useEffect(() => {
    if (tokenRef.current) tokenRef.current.focus();
  }, [mode]);

  useEffect(() => {
    if (mode !== "qr") {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(() => {});
      }
      setScannerReady(false);
      return;
    }

    let cancelled = false;
    const scanner = new Html5QrcodeScanner(
      qrRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        facingMode: "environment",
      },
      false
    );

    qrScannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        if (cancelled) return;
        const token = extractTokenFromQRValue(decodedText);
        if (!token) {
          return;
        }
        await scanner.clear().catch(() => {});
        await handleQRCheckIn(token);
      },
      () => {
        // Silently ignore scanning errors
      }
    );

    setScannerReady(true);

    return () => {
      cancelled = true;
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(() => {});
      }
      qrScannerRef.current = null;
    };
  }, [mode]);

  const handleTokenVerify = async () => {
    if (!tokenInput.trim()) {
      toast.error("Please enter a check-in token.");
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setGuestPreview(null);
    setError("");

    try {
      const response = await checkinService.verifyToken(tokenInput.trim());
      if (response.success) {
        setGuestPreview(response.data);
        if (response.data.alreadyCheckedIn) {
          setResult({
            type: "already",
            data: response.data,
            message: "ALREADY CHECKED IN",
          });
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQRCheckIn = async (qrData) => {
    const token = extractTokenFromQRValue(qrData);
    if (!token) {
      setError("The scanned QR code did not contain a usable token.");
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setGuestPreview(null);
    setError("");

    try {
      const response = await checkinService.verifyQR(token);
      if (response.success) {
        setGuestPreview(response.data);
        if (response.data.alreadyCheckedIn) {
          setResult({
            type: "already",
            data: response.data,
            message: "ALREADY CHECKED IN",
          });
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
      setScannerReady(false);
    }
  };

  const handleReset = () => {
    setTokenInput("");
    setResult(null);
    setGuestPreview(null);
    setError("");
    if (tokenRef.current) tokenRef.current.focus();
  };

  const handleConfirmCheckIn = async () => {
    if (!guestPreview) return;

    setIsCheckingIn(true);
    setError("");

    try {
      const response = mode === "qr" 
        ? await checkinService.checkInByQR(guestPreview.invitation.qrToken)
        : await checkinService.checkInByToken(guestPreview.invitation.smsToken);
      
      if (response.success) {
        setResult({
          type: "success",
          data: response.data,
          message: response.message,
        });
        setGuestPreview(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleTokenVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <PageHeader
        title="Guest Check-In"
        subtitle="Verify and check in guests at the event"
        icon="qrcode"
        className="px-4 pt-4 pb-2"
      />

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 px-4">
        <button
          onClick={() => { setMode("token"); handleReset(); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            mode === "token"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FontAwesomeIcon icon="keyboard" />
          <span className="hidden sm:inline">SMS Token</span>
          <span className="sm:hidden">Token</span>
        </button>
        <button
          onClick={() => { setMode("qr"); handleReset(); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            mode === "qr"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FontAwesomeIcon icon="qrcode" />
          <span className="hidden sm:inline">QR Scan</span>
          <span className="sm:hidden">Scan</span>
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Input Section */}
        <Card className="shadow-sm">
          <Card.Header>
            <Card.Title className="text-lg">
              <FontAwesomeIcon
                icon={mode === "token" ? "keyboard" : "qrcode"}
                className="text-indigo-500 mr-2"
              />
              {mode === "token" ? "Enter SMS Token" : "Scan QR Code"}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {mode === "token" ? (
              <div className="space-y-4">
                <Input
                  ref={tokenRef}
                  placeholder="Enter token e.g. JW-7X92-KP44"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  icon="ticket"
                  className="text-center font-mono text-xl tracking-wider py-4"
                />
                <div className="flex gap-3">
                  <Button
                    fullWidth
                    icon="magnifying-glass"
                    isLoading={isVerifying}
                    onClick={handleTokenVerify}
                    className="py-4 text-base"
                  >
                    Verify Guest
                  </Button>
                  <Button 
                    variant="secondary" 
                    icon="rotate-right" 
                    onClick={handleReset}
                    className="px-6"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-2 overflow-hidden">
                  <div 
                    id={qrRegionId} 
                    className="min-h-[300px] sm:min-h-[350px] rounded-xl bg-black/90 relative"
                  />
                  {!scannerReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
                      <div className="text-center text-white">
                        <FontAwesomeIcon icon="camera" className="text-4xl mb-3 opacity-50" />
                        <p className="text-sm opacity-70">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                {scannerReady && (
                  <p className="text-center text-sm text-gray-600 bg-indigo-50 py-2 px-4 rounded-lg">
                    <FontAwesomeIcon icon="lightbulb" className="text-indigo-500 mr-2" />
                    Point camera at guest's QR code
                  </p>
                )}

                <div className="flex justify-center">
                  <Button 
                    variant="secondary" 
                    icon="rotate-right" 
                    onClick={handleReset}
                    className="px-6 py-3"
                  >
                    Stop Scanner
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon="circle-exclamation" className="text-red-500" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </Card.Content>
        </Card>

        {/* Guest Preview Section */}
        <AnimatePresence mode="wait">
          {guestPreview && !result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-indigo-300 bg-indigo-50/30 shadow-lg shadow-indigo-100">
                <Card.Content>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-indigo-100">
                      <FontAwesomeIcon icon="user" className="text-4xl text-indigo-600" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-indigo-700">
                      Guest Found
                    </h3>
                    <p className="text-sm text-indigo-600 mt-1">Please verify guest details</p>
                  </div>

                  {/* Guest Details */}
                  <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Guest Name</span>
                      <span className="text-sm font-bold text-gray-900 text-right">
                        {guestPreview.guest?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Phone</span>
                      <span className="text-sm text-gray-900 text-right">
                        {guestPreview.guest?.phone}
                      </span>
                    </div>
                    {guestPreview.guest?.category && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Category</span>
                        <span className="text-sm text-gray-900 text-right">
                          {guestPreview.guest.category}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Event</span>
                      <span className="text-sm text-gray-900 text-right">
                        {guestPreview.event?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Invitation</span>
                      <span className="text-sm text-gray-900 text-right">
                        {guestPreview.invitation?.invitationRef}
                      </span>
                    </div>
                    
                    {/* Contribution Info */}
                    {guestPreview.guest?.contributions && guestPreview.guest.contributions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">CONTRIBUTION STATUS</p>
                        {guestPreview.guest.contributions.map((contrib, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600">Status</span>
                            <Badge status={contrib.status} size="sm" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      fullWidth
                      icon="circle-check"
                      isLoading={isCheckingIn}
                      onClick={handleConfirmCheckIn}
                      className="py-4 text-base bg-green-600 hover:bg-green-700"
                    >
                      Confirm Check-In
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      icon="times"
                      onClick={handleReset}
                      className="py-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={
                  result.type === "success"
                    ? "border-2 border-green-300 bg-green-50/30 shadow-lg shadow-green-100"
                    : "border-2 border-amber-300 bg-amber-50/30 shadow-lg shadow-amber-100"
                }
              >
                <Card.Content>
                  {/* Status Header */}
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                        result.type === "success"
                          ? "bg-green-100"
                          : "bg-amber-100"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={
                          result.type === "success"
                            ? "circle-check"
                            : "clock"
                        }
                        className={`text-4xl ${
                          result.type === "success"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-xl sm:text-2xl font-bold ${
                        result.type === "success"
                          ? "text-green-700"
                          : "text-amber-700"
                      }`}
                    >
                      {result.message}
                    </h3>
                  </div>

                  {/* Guest Details */}
                  {result.type === "success" && result.data && (
                    <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Guest Name</span>
                        <span className="text-sm font-bold text-gray-900 text-right">
                          {result.data.guest?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Phone</span>
                        <span className="text-sm text-gray-900 text-right">
                          {result.data.guest?.phone}
                        </span>
                      </div>
                      {result.data.guest?.category && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Category</span>
                          <span className="text-sm text-gray-900 text-right">
                            {result.data.guest.category}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Check-In Time</span>
                        <span className="text-sm text-gray-900 text-right">
                          {formatDateTime(result.data.checkIn?.checkedInAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-500">Checked By</span>
                        <span className="text-sm text-gray-900 text-right">
                          {result.data.checkedInBy}
                        </span>
                      </div>
                      
                      {/* Contribution Info */}
                      {result.data.guest?.contributions && result.data.guest.contributions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2 font-medium">CONTRIBUTION STATUS</p>
                          {result.data.guest.contributions.map((contrib, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1">
                              <span className="text-xs text-gray-600">Status</span>
                              <Badge status={contrib.status} size="sm" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === "already" && result.data && (
                    <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Guest Name</span>
                        <span className="text-sm font-bold text-gray-900 text-right">
                          {result.data.guest?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Checked In At</span>
                        <span className="text-sm text-gray-900 text-right">
                          {formatDateTime(result.data.checkInDetails?.checkedInAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-500">Method</span>
                        <Badge status={result.data.checkInDetails?.method} size="sm" />
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button
                      fullWidth
                      variant="secondary"
                      icon="rotate-right"
                      onClick={handleReset}
                      className="py-4 text-base"
                    >
                      Check Another Guest
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckIn;