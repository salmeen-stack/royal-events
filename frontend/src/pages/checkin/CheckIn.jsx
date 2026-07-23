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
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState("");
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
      setScannerError("");
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
      },
      false
    );

    qrScannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        if (cancelled) return;
        const token = extractTokenFromQRValue(decodedText);
        if (!token) {
          setScannerError("The scanned QR code did not contain a usable token.");
          return;
        }
        await scanner.clear().catch(() => {});
        await handleQRCheckIn(token);
      },
      (error) => {
        if (cancelled) return;
        if (error && typeof error === "string") {
          setScannerError(error);
        }
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
    setError("");

    try {
      const response = await checkinService.checkInByToken(tokenInput.trim());
      if (response.success) {
        setResult({
          type: "success",
          data: response.data,
          message: response.message,
        });
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.alreadyCheckedIn) {
        setResult({
          type: "already",
          data: errorData.errors,
          message: "ALREADY CHECKED IN",
        });
      } else {
        setError(getErrorMessage(err));
      }
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
    setError("");
    setScannerError("");

    try {
      const response = await checkinService.checkInByQR(token);
      if (response.success) {
        setResult({
          type: "success",
          data: response.data,
          message: response.message,
        });
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.alreadyCheckedIn) {
        setResult({
          type: "already",
          data: errorData.errors,
          message: "ALREADY CHECKED IN",
        });
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsVerifying(false);
      setScannerReady(false);
    }
  };

  const handleReset = () => {
    setTokenInput("");
    setResult(null);
    setError("");
    if (tokenRef.current) tokenRef.current.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleTokenVerify();
    }
  };

  return (
    <div>
      <PageHeader
        title="Guest Check-In"
        subtitle="Verify and check in guests at the event"
        icon="qrcode"
      />

      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode("token"); handleReset(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === "token"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FontAwesomeIcon icon="keyboard" />
          SMS Token
        </button>
        <button
          onClick={() => { setMode("qr"); handleReset(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === "qr"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FontAwesomeIcon icon="qrcode" />
          QR Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <Card.Header>
            <Card.Title>
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
                  className="text-center font-mono text-lg tracking-wider"
                />
                <div className="flex gap-2">
                  <Button
                    fullWidth
                    icon="magnifying-glass"
                    isLoading={isVerifying}
                    onClick={handleTokenVerify}
                  >
                    Verify Token
                  </Button>
                  <Button variant="secondary" icon="rotate-right" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-2">
                  <div id={qrRegionId} className="min-h-[280px] rounded-xl bg-black/90" />
                </div>

                {scannerReady && (
                  <p className="text-center text-sm text-gray-500">
                    Point the camera at the guest’s QR code.
                  </p>
                )}

                {scannerError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {scannerError}
                  </div>
                )}

                <div className="flex justify-center">
                  <Button variant="secondary" icon="rotate-right" onClick={handleReset}>
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
                    ? "border-2 border-green-300 bg-green-50/30"
                    : "border-2 border-red-300 bg-red-50/30"
                }
              >
                <Card.Content>
                  {/* Status Header */}
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                        result.type === "success"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={
                          result.type === "success"
                            ? "circle-check"
                            : "triangle-exclamation"
                        }
                        className={`text-3xl ${
                          result.type === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-xl font-bold ${
                        result.type === "success"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {result.message}
                    </h3>
                  </div>

                  {/* Guest Details */}
                  {result.type === "success" && result.data && (
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Guest</span>
                        <span className="text-sm font-bold text-gray-900">
                          {result.data.guest?.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Phone</span>
                        <span className="text-sm text-gray-900">
                          {result.data.guest?.phone}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Check-In Time</span>
                        <span className="text-sm text-gray-900">
                          {formatDateTime(result.data.checkIn?.checkedInAt)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-500">Checked By</span>
                        <span className="text-sm text-gray-900">
                          {result.data.checkedInBy}
                        </span>
                      </div>
                    </div>
                  )}

                  {result.type === "already" && result.data && (
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Guest</span>
                        <span className="text-sm font-bold text-gray-900">
                          {result.data.guest?.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Checked In At</span>
                        <span className="text-sm text-gray-900">
                          {formatDateTime(result.data.checkInDetails?.checkedInAt)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
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