import { useState, useEffect } from "react";
import { Bell, Search, User, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { AssignOfficerModal } from "@/components/AssignOfficerModal";
import { getComplaints } from "@/services/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // logged in user
  let displayName = "User";
  let userRole = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      if (userStr.startsWith("{")) {
        const parsed = JSON.parse(userStr);
        userRole = parsed.role;
        if (parsed.role === "admin") displayName = "Admin";
        else if (parsed.role === "ae1") displayName = "AE 1";
        else if (parsed.role === "ae2") displayName = "AE 2";
        else displayName = parsed.username || "User";
      } else {
        displayName = userStr;
      }
    }
  } catch (e) {
    displayName = "User";
  }

  // calendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    localStorage.getItem("selectedDate") ? new Date(localStorage.getItem("selectedDate")!) : new Date()
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
        const data = await getComplaints(dateStr);
        if (data && Array.isArray(data)) {
          // Sort by latest and take top 5
          const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setNotifications(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      localStorage.setItem("selectedDate", dateStr);
      // Dispatch a storage event so other components (like Overview) can listen
      window.dispatchEvent(new Event("storage"));
    }
  };

  // dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

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
      <div className="relative flex items-center gap-4">

        {(userRole === 'ae1' || userRole === 'ae2') && location.pathname === '/' && (
          <Button 
            variant="default"
            onClick={() => setShowAssignModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
          >
            Create Officer
          </Button>
        )}

        {/* Calendar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowCalendar(!showCalendar);
            setShowNotifications(false);
            setShowProfile(false);
          }}
        >
          <CalendarIcon className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowCalendar(false);
            setShowProfile(false);
          }}
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {notifications.length}
            </Badge>
          )}
        </Button>

        {/* Profile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowProfile(!showProfile);
            setShowCalendar(false);
            setShowNotifications(false);
          }}
        >
          <User className="h-5 w-5" />
        </Button>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="absolute right-32 top-14 rounded-lg border bg-white p-3 shadow-lg">
            <p className="mb-2 text-sm font-medium">
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
        )}

        {/* Notifications Popup */}
        {showNotifications && (
          <div className="absolute right-16 top-14 w-72 rounded-lg border bg-white p-4 shadow-lg max-h-[400px] overflow-y-auto">
            <h3 className="mb-2 font-semibold">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {notifications.map((notif, idx) => (
                  <li key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">
                        {notif.status === 'Resolved' ? '✅' : notif.status === 'PENDING' ? '🚨' : '⚡'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">
                          {notif.status === 'Resolved' ? 'Issue resolved' : notif.status === 'PENDING' ? 'New complaint received' : 'Complaint updated'}
                        </p>
                        <p className="text-xs text-gray-500">{notif.category} - {notif.type}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Profile Popup */}
        {showProfile && (
          <div className="absolute right-0 top-14 w-56 rounded-lg border bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm text-muted-foreground">Logged in as</p>
            <p className="mb-4 font-semibold">{displayName}</p>

            <Button
              variant="destructive"
              className="w-full flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>

      <AssignOfficerModal 
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        assignedByRole={userRole}
      />
    </>
  );
}
