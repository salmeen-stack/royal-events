import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../../config/api";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";

const InvitationView = () => {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Always fetch, show sample data if no token or API fails
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/invitations/verify/qr/${token}`);
      if (response.data.success) {
        setInvitation(response.data.data);
      } else {
        setError(response.data.message || "Invitation not found");
      }
    } catch (err) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const getSampleInvitation = () => ({
    invitationRef: "WED-2024-001",
    qrToken: "sample-token",
    smsToken: "ABC123XYZ",
    channel: "WHATSAPP",
    status: "SENT",
    sentAt: new Date().toISOString(),
    guest: {
      id: "sample-guest-id",
      name: "John & Sarah Smith",
      phone: "+255712345678",
      email: "john.smith@example.com",
    },
    event: {
      id: "sample-event-id",
      name: "Royal Wedding Ceremony",
      eventDate: "2024-12-15T14:00:00Z",
      eventTime: "2:00 PM",
      venue: "Grand Royal Hotel Ballroom",
      location: "Dar es Salaam, Tanzania",
    },
  });

  const handleScratch = (e) => {
    if (isRevealed) return;
    e.stopPropagation(); // Prevent flip when scratching

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;

    if (percentage > 40) {
      setIsRevealed(true);
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 0.5s";
      setTimeout(() => {
        canvas.style.display = "none";
        triggerConfetti();
      }, 500);
    }
  };

  const handleCardClick = (e) => {
    // Don't flip if clicking on canvas (scratch area)
    if (e.target.closest('canvas')) return;
    setIsFlipped(!isFlipped);
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FF69B4", "#FFC0CB", "#E6E6FA", "#FFF0F5"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FF69B4", "#FFC0CB", "#E6E6FA", "#FFF0F5"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Use fixed dimensions since container has fixed dimensions
    canvas.width = 300;
    canvas.height = 300;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#FFD700");
    gradient.addColorStop(0.5, "#FFC0CB");
    gradient.addColorStop(1, "#FFD700");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < canvas.width; i += 20) {
      for (let j = 0; j < canvas.height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = "#8B4513";
    ctx.font = "bold 20px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ SCRATCH ME ✨", canvas.width / 2, canvas.height / 2);
    ctx.font = "14px Georgia, serif";
    ctx.fillText("Reveal your QR code", canvas.width / 2, canvas.height / 2 + 25);
  };

  useEffect(() => {
    if (isFlipped && canvasRef.current) {
      initCanvas();
    }
  }, [isFlipped]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-300 border-t-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-800 font-serif text-xl">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <FontAwesomeIcon icon="heart-crack" className="text-6xl text-pink-400 mb-4" />
          <h2 className="text-2xl font-serif text-pink-800 mb-2">Invitation Not Found</h2>
          <p className="text-pink-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const event = invitation?.event;
  const guest = invitation?.guest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-pink-800 mb-2">
            💒 Invitation 💒
          </h1>
          <p className="text-pink-600 font-serif text-lg">
            You're cordially invited
          </p>
        </div>

        {/* Flip Card */}
        <div className="perspective-1000">
          <div
            className={`relative w-full transition-transform duration-700 transform-style-3d cursor-pointer ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{ minHeight: "600px" }}
            onClick={handleCardClick}
          >
            {/* Front - Ceremony Details */}
            <div
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden backface-hidden"
            >
              {/* Decorative Border */}
              <div className="absolute inset-4 border-4 border-double border-pink-300 rounded-2xl pointer-events-none"></div>
              
              {/* Content */}
              <div className="p-8 md:p-12 text-center relative z-10">
                {/* Decorative Elements */}
                <div className="text-5xl mb-4">💍</div>
                
                <h2 className="text-3xl md:text-4xl font-serif text-pink-800 mb-2">
                  {event?.name}
                </h2>
                
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent mx-auto my-6"></div>
                
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon="calendar" className="text-pink-500" />
                    <span className="font-serif text-lg">
                      {new Date(event?.eventDate).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon="clock" className="text-pink-500" />
                    <span className="font-serif text-lg">{event?.eventTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon="location-dot" className="text-pink-500" />
                    <span className="font-serif text-lg">{event?.venue}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon="map-marker-alt" className="text-pink-500" />
                    <span className="font-serif text-lg">{event?.location}</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <p className="text-pink-800 font-serif text-sm mb-1">Invited Guest</p>
                  <p className="text-2xl font-serif text-pink-900 font-semibold">
                    {guest?.name}
                  </p>
                  <p className="text-pink-600 font-serif text-sm mt-1">
                    Reference: {invitation?.invitationRef}
                  </p>
                </div>

                <div className="mt-8">
                  <p className="text-pink-600 font-serif text-sm animate-pulse">
                    ✨ Tap to reveal your QR code ✨
                  </p>
                </div>
              </div>

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 text-3xl opacity-50">🌸</div>
              <div className="absolute top-4 right-4 text-3xl opacity-50">🌸</div>
              <div className="absolute bottom-4 left-4 text-3xl opacity-50">🌸</div>
              <div className="absolute bottom-4 right-4 text-3xl opacity-50">🌸</div>
            </div>

            {/* Back - Scratch Card with QR Code */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden backface-hidden rotate-y-180"
            >
              {/* Decorative Border */}
              <div className="absolute inset-4 border-4 border-double border-pink-300 rounded-2xl pointer-events-none"></div>
              
              <div className="p-8 md:p-12 text-center relative z-10 h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🎁</div>
                
                <h3 className="text-2xl font-serif text-pink-800 mb-2">
                  Your Special Gift
                </h3>
                
                <p className="text-pink-600 font-serif mb-6">
                  Scratch to reveal your check-in QR code
                </p>

                {/* Scratch Card Container */}
                <div className="relative w-[300px] h-[300px] mx-auto">
                  {/* QR Code (Hidden behind scratch layer) */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl shadow-inner z-0">
                    {invitation?.qrCodeUrl ? (
                      <img 
                        src={invitation.qrCodeUrl} 
                        alt="QR Code" 
                        className="w-64 h-64"
                      />
                    ) : (
                      <QRCodeSVG
                        value={invitation?.qrToken || invitation?.smsToken || ""}
                        size={256}
                        level="H"
                        includeMargin={true}
                        fgColor="#8B4513"
                        bgColor="#FFF0F5"
                      />
                    )}
                  </div>

                  {/* Scratch Overlay */}
                  {!isRevealed && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 rounded-xl cursor-crosshair touch-none z-10 pointer-events-auto"
                      onMouseDown={handleScratch}
                      onMouseMove={handleScratch}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleScratch({
                          clientX: touch.clientX,
                          clientY: touch.clientY,
                        });
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleScratch({
                          clientX: touch.clientX,
                          clientY: touch.clientY,
                        });
                      }}
                    />
                  )}
                </div>

                {isRevealed && (
                  <div className="mt-6 animate-bounce">
                    <p className="text-pink-800 font-serif text-lg">
                      🎉 Present this QR code at the entrance 🎉
                    </p>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="mt-6 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-serif rounded-full transition-colors"
                >
                  ← Back to Details
                </button>
              </div>

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 text-3xl opacity-50">💕</div>
              <div className="absolute top-4 right-4 text-3xl opacity-50">💕</div>
              <div className="absolute bottom-4 left-4 text-3xl opacity-50">💕</div>
              <div className="absolute bottom-4 right-4 text-3xl opacity-50">💕</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-pink-600 font-serif text-sm">
            Made with 💕 for your special day
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationView;
