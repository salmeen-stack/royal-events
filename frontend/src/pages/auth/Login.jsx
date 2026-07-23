import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAuthStore from "../../store/authStore";
import authService from "../../services/auth.service";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { APP_NAME } from "../../config/constants";
import { getErrorMessage } from "../../utils/helpers";
import logo from "../../assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      if (response.success) {
        login(response.data.user, response.data.token);
        const userRole = response.data.user?.role;
        if (userRole === "EVENT_OWNER") {
          navigate("/event-owner-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <div className="flex items-center gap-4 mb-10">
              <motion.div
                className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl backdrop-blur-sm shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring" }}
              >
                <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain p-2" />
              </motion.div>
              <h1 className="text-white text-3xl font-bold tracking-tight">{APP_NAME}</h1>
            </div>
            <h2 className="text-white text-5xl font-bold leading-tight mb-6">
              Manage Events.
              <br />
              Track Contributions.
              <br />
              Verify Guests.
            </h2>
            <p className="text-white/80 text-lg max-w-lg leading-relaxed">
              A complete digital event contribution, invitation, reminder,
              and guest verification platform for modern event management.
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-2 gap-6 max-w-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          >
            {[
              { icon: "hand-holding-dollar", title: "Contributions", desc: "Track every payment" },
              { icon: "envelope", title: "Invitations", desc: "Digital QR & SMS" },
              { icon: "bell", title: "Reminders", desc: "Automated alerts" },
              { icon: "qrcode", title: "Check-In", desc: "QR scan & token" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                whileHover={{ y: -5 }}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="text-white/90 text-xl mb-3"
                />
                <p className="text-white font-semibold mb-1">{item.title}</p>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="flex items-center gap-3 mb-10 lg:hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl overflow-hidden shadow-lg">
              <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain p-2" />
            </div>
            <h1 className="text-gray-900 text-2xl font-bold">{APP_NAME}</h1>
          </motion.div>

          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">
              Sign in to your account to continue
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert
                  type="error"
                  message={error}
                  show={!!error}
                  onClose={() => setError("")}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                label="Email Address"
                type="email"
                icon="envelope"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="filled"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="filled"
              />
              <motion.button
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPassword(!showPassword)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={showPassword ? "eye-slash" : "eye"}
                />
                {showPassword ? "Hide password" : "Show password"}
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                fullWidth
                size="lg"
                icon="right-to-bracket"
                isLoading={isLoading}
                className="mt-4 shadow-lg shadow-indigo-500/30"
              >
                Sign In
              </Button>
            </motion.div>
          </motion.form>

          <motion.div
            className="mt-12 pt-8 border-t border-gray-200 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm text-gray-400">
              {APP_NAME} Management System &copy;{" "}
              {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;