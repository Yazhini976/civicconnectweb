import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Overview from "./pages/Overview";
import Citizen from "./pages/Citizen";
import FieldTeam from "./pages/FieldTeam";
import Reports from "./pages/Reports";

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// 🔐 SIMPLE LOGIN CHECK (Session-based)
const isLoggedIn = () => {
  return sessionStorage.getItem("user") !== null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🔓 LOGIN PAGE */}
          <Route path="/login" element={<Login />} />

          {/* 🔒 PROTECTED ADMIN ROUTES */}
          <Route
            path="/"
            element={
              isLoggedIn() ? <Overview /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/citizen"
            element={
              isLoggedIn() ? <Citizen /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/field-team"
            element={
              isLoggedIn() ? <FieldTeam /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/reports"
            element={
              isLoggedIn() ? <Reports /> : <Navigate to="/login" replace />
            }
          />


          {/* ❌ 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;