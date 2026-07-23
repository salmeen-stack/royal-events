import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: 0.2 },
  },
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Royal Events Management System &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;