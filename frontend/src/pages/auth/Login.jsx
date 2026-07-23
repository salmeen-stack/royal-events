import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
        navigate("/dashboard");
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl backdrop-blur-sm overflow-hidden">
                <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-white text-2xl font-bold">{APP_NAME}</h1>
            </div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Manage Events.
              <br />
              Track Contributions.
              <br />
              Verify Guests.
            </h2>
            <p className="text-indigo-200 text-base max-w-md">
              A complete digital event contribution, invitation, reminder,
              and guest verification platform.
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-2 gap-4 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FontAwesomeIcon
                icon="hand-holding-dollar"
                className="text-indigo-300 text-lg mb-2"
              />
              <p className="text-white text-sm font-medium">Contributions</p>
              <p className="text-indigo-300 text-xs mt-0.5">
                Track every payment
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FontAwesomeIcon
                icon="envelope"
                className="text-indigo-300 text-lg mb-2"
              />
              <p className="text-white text-sm font-medium">Invitations</p>
              <p className="text-indigo-300 text-xs mt-0.5">
                Digital QR & SMS
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FontAwesomeIcon
                icon="bell"
                className="text-indigo-300 text-lg mb-2"
              />
              <p className="text-white text-sm font-medium">Reminders</p>
              <p className="text-indigo-300 text-xs mt-0.5">
                Automated alerts
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FontAwesomeIcon
                icon="qrcode"
                className="text-indigo-300 text-lg mb-2"
              />
              <p className="text-white text-sm font-medium">Check-In</p>
              <p className="text-indigo-300 text-xs mt-0.5">
                QR scan & token
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl overflow-hidden border border-gray-200">
              <img src={logo} alt="Royal Events logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-gray-900 text-xl font-bold">{APP_NAME}</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <Alert
            type="error"
            message={error}
            show={!!error}
            onClose={() => setError("")}
            className="mb-4"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon="envelope"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <FontAwesomeIcon
                  icon={showPassword ? "eye-slash" : "eye"}
                  className="mr-1"
                />
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              icon="right-to-bracket"
              isLoading={isLoading}
              className="mt-6"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {APP_NAME} Management System &copy;{" "}
              {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;