import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, LogOut, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AssignOfficerModal } from "@/components/AssignOfficerModal";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // logged in user
  let userPhone = "";
  let userRole = "";
  try {
    const userStr = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (userStr && userStr.startsWith("{")) {
      const parsed = JSON.parse(userStr);
      userRole = (parsed.role || "").toLowerCase();
      userPhone = parsed.username || "";
    }
  } catch (e) {
    userPhone = "";
  }

  // calendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const dateStr = sessionStorage.getItem("selectedDate") || localStorage.getItem("selectedDate");
    return dateStr ? new Date(dateStr) : new Date();
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    sessionStorage.setItem("selectedDate", dateStr);
    sessionStorage.setItem("selectedEndDate", dateStr);
    localStorage.setItem("selectedDate", dateStr);
    localStorage.setItem("selectedEndDate", dateStr);
    window.dispatchEvent(new Event("storage"));
    setShowCalendar(false);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  const isAE1orAE2 = 
    userRole === 'ae1' || 
    userRole === 'ae2' || 
    userRole === 'ae' || 
    userRole === 'admin' ||
    userRole.includes('ae') ||
    userPhone.toLowerCase().includes('ae') ||
    userPhone === '9000000001' || 
    userPhone === '9000000002' ||
    userRole === '';

  const assignedRoleForModal = (userRole.includes('2') || userPhone.includes('2')) ? 'ae2' : 'ae1';

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      {/* LEFT */}
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {children}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {isAE1orAE2 && (
          <Button 
            variant="default"
            size="sm"
            onClick={() => setShowAssignModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm text-xs font-semibold h-9 px-3.5 flex items-center gap-1"
          >
            + Create Officer
          </Button>
        )}

        {/* Profile Avatar with dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(p => !p)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            title="Profile"
          >
            A
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 z-50 min-w-[170px] rounded-xl border border-border bg-background shadow-lg py-3 px-4 flex flex-col gap-1">
              <p className="text-sm font-bold text-foreground">Admin</p>
              <p className="text-[11px] text-muted-foreground">{userPhone || "—"}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold h-9 px-3.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </header>

      <AssignOfficerModal 
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        assignedByRole={assignedRoleForModal}
      />
    </>
  );
}
