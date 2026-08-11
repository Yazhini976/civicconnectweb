// API Service for UGSS Command Center Backend
// Set VITE_API_BASE_URL in your .env file (e.g. https://your-backend.com/api)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082/api';

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
  const loggedInRole = getUserRole();
  const response = await fetch(`${API_BASE_URL}/dXNlcnMvcm9sZQ?role=${role}&userRole=${loggedInRole}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

// ==========================================
// STATION API
// ==========================================

export const getAllStations = async () => { return []; };

export const getStationsByType = async (type: string) => { return []; };

export const getEquipmentByStation = async (stationId: number) => { return []; };

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

export const getFaultsByStation = async (stationId: number) => { return []; };

export const getPendingFaults = async (date?: string) => { return []; };

export const getStationCounts = async () => { return { total: 0, lifting: 0, pumping: 0, stp: 0 }; };

export function getUserRole() {
  try {
    const userRole = localStorage.getItem("user_role");
    if (userRole) return userRole;

    const userStr = localStorage.getItem("user");
    if (userStr) {
      if (userStr.startsWith("{")) {
        const parsed = JSON.parse(userStr);
        if (parsed.role) return parsed.role;
        if (parsed.username === 'ae1' || parsed.username === '9000000001' || parsed.username === 'fieldofficer1') return 'ae1';
      } else {
        return userStr;
      }
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


export const getEnergyTrend = async (date?: string) => { return []; };

export const getSLATrend = async (date?: string) => { return []; };

export const getOfficerStats = async (role?: string) => {
  const url = role ? `${API_BASE_URL}/ZGFzaGJvYXJkL29mZmljZXItc3RhdHM?role=${role}` : `${API_BASE_URL}/ZGFzaGJvYXJkL29mZmljZXItc3RhdHM`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch officer stats');
  return response.json();
};

export const getWards = async () => {
  const response = await fetch(`${API_BASE_URL}/d2FyZHM=`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const res2 = await fetch(`${API_BASE_URL}/wards`, { headers: getAuthHeaders() });
    if (!res2.ok) throw new Error('Failed to fetch wards');
    return res2.json();
  }
  return response.json();
};
