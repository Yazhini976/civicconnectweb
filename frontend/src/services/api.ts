// API Service for UGSS Command Center Backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api';

// Returns Authorization header with JWT token from localStorage
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ==========================================
// USER API
// ==========================================

export const getUserByMobile = async (mobile: string) => {
  const response = await fetch(`${API_BASE_URL}/dXNlcnMvbW9iaWxl?mobile=${mobile}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

export const getUsersByRole = async (role: string) => {
  const response = await fetch(`${API_BASE_URL}/dXNlcnMvcm9sZQ?role=${role}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

// ==========================================
// STATION API
// ==========================================

export const getAllStations = async () => {
  const response = await fetch(`${API_BASE_URL}/c3RhdGlvbnM`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
};

export const getStationsByType = async (type: string) => {
  const response = await fetch(`${API_BASE_URL}/c3RhdGlvbnMvdHlwZQ?type=${type}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
};

export const getEquipmentByStation = async (stationId: number) => {
  const response = await fetch(`${API_BASE_URL}/ZXF1aXBtZW50?station_id=${stationId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch equipment');
  return response.json();
};

// ==========================================
// COMPLAINT API
// ==========================================

export const getComplaintsByWard = async (ward: string) => {
  const response = await fetch(`${API_BASE_URL}/Y29tcGxhaW50cy93YXJk?ward=${ward}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getComplaintsByStatus = async (status: string) => {
  const response = await fetch(`${API_BASE_URL}/Y29tcGxhaW50cy9zdGF0dXM?status=${status}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getComplaintStats = async (date?: string) => {
  const role = getUserRole();
  const url = new URL(`${API_BASE_URL}/Y29tcGxhaW50cy9zdGF0cw`);
  if (date) url.searchParams.append('date', date);
  if (role) url.searchParams.append('role', role);
  const response = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch complaint stats');
  return response.json();
};

export const getComplaintTypeStats = async (date?: string) => {
  const role = getUserRole();
  const url = new URL(`${API_BASE_URL}/Y29tcGxhaW50cy90eXBlLXN0YXRz`);
  if (date) url.searchParams.append('date', date);
  if (role) url.searchParams.append('role', role);
  const response = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch complaint type stats');
  return response.json();
};

// ==========================================
// WORK ORDER API
// ==========================================

export const getWorkOrdersByStaff = async (staffId: number) => {
  const response = await fetch(`${API_BASE_URL}/d29yay1vcmRlcnMvc3RhZmY?staff_id=${staffId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch work orders');
  return response.json();
};

// ==========================================
// FAULT API
// ==========================================

export const getFaultsByStation = async (stationId: number) => {
  const response = await fetch(`${API_BASE_URL}/ZmF1bHRzL3N0YXRpb24?station_id=${stationId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch faults');
  return response.json();
};

export const getPendingFaults = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/ZmF1bHRzL3BlbmRpbmc?date=${date}` : `${API_BASE_URL}/ZmF1bHRzL3BlbmRpbmc`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch pending faults');
  return response.json();
};

export const getStationCounts = async () => {
  const response = await fetch(`${API_BASE_URL}/ZGFzaGJvYXJkL3N0YXRpb24tY291bnRz`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch station counts');
  return response.json();
};

function getUserRole() {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr.startsWith("{")) {
      const parsed = JSON.parse(userStr);
      return parsed.role;
    }
  } catch (e) {
    // Ignore
  }
  return '';
};

export const getComplaints = async (date?: string) => {
  const role = getUserRole();
  const url = new URL(`${API_BASE_URL}/Y29tcGxhaW50cw`);
  if (date) url.searchParams.append('date', date);
  if (role) url.searchParams.append('role', role);
  const response = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch complaints');
  return response.json();
};

export const getWorkOrders = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/d29yay1vcmRlcnM?date=${date}` : `${API_BASE_URL}/d29yay1vcmRlcnM`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch work orders');
  return response.json();
};

export const createComplaint = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/Y29tcGxhaW50cw`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create complaint');
  return response.json();
};

export const getLiftingLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/bG9ncy9saWZ0aW5n?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/bG9ncy9saWZ0aW5n?station_id=${stationId}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch lifting logs');
  return response.json();
};

export const getPumpingLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/bG9ncy9wdW1waW5n?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/bG9ncy9wdW1waW5n?station_id=${stationId}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch pumping logs');
  return response.json();
};

export const getSTPLogs = async (stationId: number, date?: string) => {
  const url = date ? `${API_BASE_URL}/bG9ncy9zdHA?station_id=${stationId}&date=${date}` : `${API_BASE_URL}/bG9ncy9zdHA?station_id=${stationId}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch STP logs');
  return response.json();
};

export const getEnergyTrend = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/ZW5lcmd5L3RyZW5k?date=${date}` : `${API_BASE_URL}/ZW5lcmd5L3RyZW5k`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch energy trend');
  return response.json();
};

export const getSLATrend = async (date?: string) => {
  const url = date ? `${API_BASE_URL}/c2xhL3RyZW5k?date=${date}` : `${API_BASE_URL}/c2xhL3RyZW5k`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch SLA trend');
  return response.json();
};

export const getOfficerStats = async () => {
  const response = await fetch(`${API_BASE_URL}/ZGFzaGJvYXJkL29mZmljZXItc3RhdHM`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch officer stats');
  return response.json();
};
