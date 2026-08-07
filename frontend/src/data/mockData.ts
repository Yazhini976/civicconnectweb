// UGSS Dashboard Mock Data
// Configuration as per requirements

export const CONFIG = {
  totalWards: 42,
  totalSewerNetwork: 157.74, // km
  maxComplaints: 100,
  maxFieldStaff: 10,
  pumpsPerStation: 4,
};

export const LIFTING_STATIONS = [
  { id: 'LS-001', name: 'Kothankulam Road', zone: 'Zone 1', ward: 5 },
  { id: 'LS-002', name: 'Samandhapuram', zone: 'Zone 2', ward: 12 },
  { id: 'LS-003', name: 'Chandhoorani', zone: 'Zone 2', ward: 18 },
  { id: 'LS-004', name: 'Thiruvananthapuram Street', zone: 'Zone 3', ward: 28 },
];

export const PUMPING_STATIONS = [
  { id: 'PS-001', name: 'Zone 1 – North Avarampatti', zone: 'Zone 1', ward: 8 },
  { id: 'PS-002', name: 'Zone 2 – Indira Nagar', zone: 'Zone 2', ward: 15 },
];

export const STP_STATIONS = [
  {
    id: 'STP-001',
    name: 'Konthankulam STP',
    dischargeLocation: 'Konthankulam Irrigation Tank',
    installedCapacity: 27.5,
    capacity: 12,
    currentLoad: 9.8,
  },
  {
    id: 'STP-002',
    name: 'South Zone STP',
    dischargeLocation: 'South Reservoir',
    installedCapacity: 15.0,
    capacity: 10,
    currentLoad: 7.5,
  },
];


export type ComplaintStatus = 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved';
export type ComplaintType = 'Blockage' | 'Overflow' | 'Leakage' | 'Odour' | 'Others';
export type ComplaintCategory = 'UGSS' | 'Sewer' | 'Manhole';
export type AreaType = 'Residential' | 'Commercial' | 'Public Road';
export type EscalationLevel = 'Field' | 'JE' | 'AE' | 'Commissioner';

export interface Complaint {
  id: string;
  fullName: string;
  userRole: 'Citizen' | 'Public' | 'NGOs';
  wardNumber: number;
  streetName: string;
  doorNumber: string;
  landmark: string;
  category: ComplaintCategory;
  type: ComplaintType;
  areaType: AreaType;
  repeatComplaint: boolean;
  hasPhoto: boolean;
  hasAudio: boolean;
  status: ComplaintStatus;
  expectedResolutionTime: string;
  slaRemaining: number;
  slaBreached: boolean;

  /* ✅ NEW – OFFICER NAMES */
  fieldOfficerName: string;
  juniorEngineerName: string;
  commissionerName: string;

  escalationLevel: EscalationLevel | null;

  financialHold: boolean;
  financialDelayReason: string | null;
  citizenFeedback: string | null;
  serviceRating: number | null;
  workQualityRating: number | null;
  createdAt: string;
  updatedAt: string;
}


export interface FieldOfficer {
  id: string;
  name: string;
  designation: 'Field Officer' | 'JE' | 'AE' | 'Commissioner';
  mobile: string;
  zone: string;
  totalAssigned: number;
  openComplaints: number;
  inProgress: number;
  slaApproaching: number;
  slaViolated: number;
  avgResolutionTime: number; // hours
  slaCompliancePercent: number;
  repeatIssues: number;
  score: number;
  status: 'Active' | 'On Leave' | 'Training';
}

export interface LiftingStationData {
  id: string;
  name: string;
  zone: string;
  ward: number;
  gps: { lat: number; lng: number };
  operator: string;
  pumps: {
    id: string;
    status: 'Running' | 'Standby' | 'Maintenance' | 'Fault';
    runHours: number;
    flowRate: number;
    currentAmps: number;
  }[];
  hasDG: boolean;
  dgStatus: 'Available' | 'Running' | 'Maintenance';
  wetWell: {
    level: number; // percentage
    status: 'Normal' | 'High' | 'Low' | 'Critical';
  };
  electrical: {
    voltage: number;
    powerFactor: number;
    energyConsumption: number; // kWh
  };
  housekeeping: 'Excellent' | 'Good' | 'Average' | 'Poor';
  faultCount: number;
  safetyCompliance: boolean;
  dailyCost: number;
  assetHealthIndex: number;
  taskCompletion: number;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
}

export interface PumpingStationData {
  id: string;
  name: string;
  zone: string;
  ward: number;
  gps: { lat: number; lng: number };
  operator: string;
  pumps: {
    id: string;
    status: 'Running' | 'Standby' | 'Maintenance' | 'Fault';
    runHours: number;
    flowRate: number;
    currentAmps: number;
    efficiency: number;
  }[];
  wetWell: {
    level: number;
    status: 'Normal' | 'High' | 'Low' | 'Critical';
  };
  totalFlow: number; // MLD
  voltage: number;
  hasDG: boolean;
  dgStatus: 'Available' | 'Running' | 'Maintenance';
  maintenanceStatus: 'Up to Date' | 'Due' | 'Overdue';
  faultCount: number;
  escalations: number;
  dailyReportingPercent: number;
  abnormalAlerts: number;
  energyEfficiency: number;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
  overhaulDue: boolean;
}

export interface STPOperationalData {

  id: string;
  name: string;
  dischargeLocation: string;

  installedCapacity: number; // NEW
  capacity: number;          // operating capacity

  currentLoad: number;



  inlet: {
    bod: number;
    cod: number;
    tss: number;
    ph: number;
  };
  outlet: {
    bod: number;
    cod: number;
    tss: number;
    ph: number;
    compliance: boolean;
  };
  processParameters: {
    aerationTime: number;
    sludgeAge: number;
    mlss: number;
  };
  sludge: {
    generated: number;
    disposed: number;
    pending: number;
  };
  energy: {
    consumption: number;
    cost: number;
  };
  chemicals: {
    chlorine: number;
    polymer: number;
  };
  faultCount: number;
  pollutionRisk: 'Low' | 'Medium' | 'High';
  escalations: number;
  compliancePercent: number;
  legalRisk: 'Low' | 'Medium' | 'High';
  environmentalRisk: 'Low' | 'Medium' | 'High';
}

// Generate mock complaints
export const generateComplaints = (): Complaint[] => {
  const complaints: Complaint[] = [];
  const statuses: ComplaintStatus[] = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
  const types: ComplaintType[] = ['Blockage', 'Overflow', 'Leakage', 'Others'];
  const categories: ComplaintCategory[] = ['UGSS', 'Sewer', 'Manhole'];
  const areas: AreaType[] = ['Residential', 'Commercial', 'Public Road'];
  const streetNames = ['MG Road', 'Gandhi Street', 'Nehru Avenue', 'Subhash Lane', 'Patel Nagar', 'Ambedkar Road'];
  const names = ['Ravi Kumar', 'Priya Sharma', 'Arun Patel', 'Lakshmi Devi', 'Suresh Reddy', 'Anitha M', 'Karthik S', 'Deepa R'];
  const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon'];

  for (let i = 1; i <= 87; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const slaRemaining = Math.floor(Math.random() * 48) - 12;


    const fieldOfficers = [
      'Rajesh Kumar',
      'Suresh P',
      'Anand M',
      'Venkat R',
      'Krishna S',
    ];

    const juniorEngineers = ['Mohan Kumar', 'Lakshmi N'];
    const commissioners = ['Dr. Senthil Kumar'];

    complaints.push({
      id: `CMP-${String(i).padStart(4, '0')}`,
      fullName: names[Math.floor(Math.random() * names.length)],
      userRole: ['Citizen', 'Public', 'NGOs'][Math.floor(Math.random() * 3)] as any,
      wardNumber: Math.floor(Math.random() * 42) + 1,
      streetName: streetNames[Math.floor(Math.random() * streetNames.length)],
      doorNumber: `${Math.floor(Math.random() * 500) + 1}`,
      landmark: 'Near Bus Stop',
      category: categories[Math.floor(Math.random() * categories.length)],
      type: types[Math.floor(Math.random() * types.length)],
      areaType: areas[Math.floor(Math.random() * areas.length)],
      repeatComplaint: Math.random() > 0.85,
      hasPhoto: Math.random() > 0.3,
      hasAudio: Math.random() > 0.7,
      status,
      expectedResolutionTime: '24 hours',
      slaRemaining,
      slaBreached: slaRemaining < 0,

      /* ✅ OFFICER ASSIGNMENT */
      fieldOfficerName: fieldOfficers[Math.floor(Math.random() * fieldOfficers.length)],
      juniorEngineerName: juniorEngineers[Math.floor(Math.random() * juniorEngineers.length)],
      commissionerName: commissioners[0],

      escalationLevel:
        slaRemaining < -12
          ? 'Commissioner'
          : slaRemaining < -6
            ? 'JE'
            : null,

      financialHold: status === 'In Progress' && Math.random() > 0.8,
      financialDelayReason: null,
      citizenFeedback: status === 'Resolved' ? 'Satisfactory service' : null,
      serviceRating: status === 'Resolved' ? Math.floor(Math.random() * 3) + 3 : null,
      workQualityRating: status === 'Resolved' ? Math.floor(Math.random() * 3) + 3 : null,
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

  }

  return complaints;
};

// Generate field officers
export const generateFieldOfficers = (): FieldOfficer[] => {
  const officers: FieldOfficer[] = [
    { id: 'FO-001', name: 'Rajesh Kumar', designation: 'Field Officer', mobile: '9876543210', zone: 'Zone 1', totalAssigned: 15, openComplaints: 3, inProgress: 5, slaApproaching: 2, slaViolated: 1, avgResolutionTime: 18, slaCompliancePercent: 92, repeatIssues: 1, score: 88, status: 'Active' },
    { id: 'FO-002', name: 'Suresh P', designation: 'Field Officer', mobile: '9876543211', zone: 'Zone 1', totalAssigned: 12, openComplaints: 2, inProgress: 4, slaApproaching: 1, slaViolated: 0, avgResolutionTime: 14, slaCompliancePercent: 96, repeatIssues: 0, score: 94, status: 'Active' },
    { id: 'FO-003', name: 'Anand M', designation: 'Field Officer', mobile: '9876543212', zone: 'Zone 2', totalAssigned: 18, openComplaints: 5, inProgress: 6, slaApproaching: 3, slaViolated: 2, avgResolutionTime: 22, slaCompliancePercent: 85, repeatIssues: 2, score: 78, status: 'Active' },
    { id: 'FO-004', name: 'Venkat R', designation: 'Field Officer', mobile: '9876543213', zone: 'Zone 2', totalAssigned: 10, openComplaints: 1, inProgress: 3, slaApproaching: 0, slaViolated: 0, avgResolutionTime: 12, slaCompliancePercent: 98, repeatIssues: 0, score: 96, status: 'Active' },
    { id: 'FO-005', name: 'Krishna S', designation: 'Field Officer', mobile: '9876543214', zone: 'Zone 3', totalAssigned: 14, openComplaints: 4, inProgress: 4, slaApproaching: 2, slaViolated: 1, avgResolutionTime: 20, slaCompliancePercent: 89, repeatIssues: 1, score: 82, status: 'Active' },
    { id: 'JE-001', name: 'Mohan Kumar', designation: 'JE', mobile: '9876543220', zone: 'All Zones', totalAssigned: 45, openComplaints: 8, inProgress: 12, slaApproaching: 4, slaViolated: 2, avgResolutionTime: 16, slaCompliancePercent: 91, repeatIssues: 3, score: 87, status: 'Active' },
    { id: 'JE-002', name: 'Lakshmi N', designation: 'JE', mobile: '9876543221', zone: 'All Zones', totalAssigned: 42, openComplaints: 6, inProgress: 10, slaApproaching: 3, slaViolated: 1, avgResolutionTime: 15, slaCompliancePercent: 93, repeatIssues: 2, score: 90, status: 'Active' },
    { id: 'AE-001', name: 'Ramesh Babu', designation: 'AE', mobile: '9876543230', zone: 'All Zones', totalAssigned: 87, openComplaints: 12, inProgress: 18, slaApproaching: 5, slaViolated: 3, avgResolutionTime: 17, slaCompliancePercent: 90, repeatIssues: 4, score: 86, status: 'Active' },
    { id: 'AE-002', name: 'Priya Mani', designation: 'AE', mobile: '9876543231', zone: 'All Zones', totalAssigned: 0, openComplaints: 0, inProgress: 0, slaApproaching: 0, slaViolated: 0, avgResolutionTime: 0, slaCompliancePercent: 0, repeatIssues: 0, score: 0, status: 'On Leave' },
    { id: 'CM-001', name: 'Dr. Senthil Kumar', designation: 'Commissioner', mobile: '9876543240', zone: 'All Zones', totalAssigned: 87, openComplaints: 15, inProgress: 22, slaApproaching: 6, slaViolated: 4, avgResolutionTime: 16, slaCompliancePercent: 91, repeatIssues: 5, score: 88, status: 'Active' },
  ];
  return officers;
};

// Generate lifting station data
export const generateLiftingStations = (): LiftingStationData[] => {
  return LIFTING_STATIONS.map((station, idx) => ({
    ...station,
    gps: { lat: 10.79 + idx * 0.01, lng: 78.68 + idx * 0.01 },
    operator: ['Rajesh', 'Suresh', 'Mohan', 'Venkat'][idx],
    pumps: Array.from({ length: 4 }, (_, i) => ({
      id: `P${i + 1}`,
      status: ['Running', 'Standby', 'Running', 'Maintenance'][i] as any,
      runHours: Math.floor(Math.random() * 2000) + 500,
      flowRate: Math.floor(Math.random() * 50) + 20,
      currentAmps: Math.floor(Math.random() * 30) + 10,
    })),
    hasDG: true,
    dgStatus: 'Available' as const,
    wetWell: {
      level: Math.floor(Math.random() * 40) + 30,
      status: 'Normal' as const,
    },
    electrical: {
      voltage: 415 + Math.floor(Math.random() * 10) - 5,
      powerFactor: 0.85 + Math.random() * 0.1,
      energyConsumption: Math.floor(Math.random() * 500) + 200,
    },
    housekeeping: ['Excellent', 'Good', 'Good', 'Average'][idx] as any,
    faultCount: Math.floor(Math.random() * 3),
    safetyCompliance: Math.random() > 0.2,
    dailyCost: Math.floor(Math.random() * 5000) + 2000,
    assetHealthIndex: Math.floor(Math.random() * 20) + 75,
    taskCompletion: Math.floor(Math.random() * 15) + 85,
    complianceStatus: 'Compliant' as const,
  }));
};

// Generate pumping station data
export const generatePumpingStations = (): PumpingStationData[] => {
  return PUMPING_STATIONS.map((station, idx) => ({
    ...station,
    gps: { lat: 10.80 + idx * 0.02, lng: 78.70 + idx * 0.02 },
    operator: ['Kumar', 'Rajan', 'Selvam'][idx],
    pumps: Array.from({ length: 4 }, (_, i) => ({
      id: `P${i + 1}`,
      status: ['Running', 'Running', 'Standby', 'Running'][i] as any,
      runHours: Math.floor(Math.random() * 3000) + 1000,
      flowRate: Math.floor(Math.random() * 100) + 50,
      currentAmps: Math.floor(Math.random() * 50) + 20,
      efficiency: Math.floor(Math.random() * 15) + 80,
    })),
    wetWell: {
      level: Math.floor(Math.random() * 35) + 35,
      status: 'Normal' as const,
    },
    totalFlow: parseFloat((Math.random() * 3 + 2).toFixed(2)),
    voltage: 415 + Math.floor(Math.random() * 10) - 5,
    hasDG: true,
    dgStatus: 'Available' as const,
    maintenanceStatus: ['Up to Date', 'Up to Date', 'Due'][idx] as any,
    faultCount: Math.floor(Math.random() * 2),
    escalations: Math.floor(Math.random() * 2),
    dailyReportingPercent: Math.floor(Math.random() * 10) + 90,
    abnormalAlerts: Math.floor(Math.random() * 3),
    energyEfficiency: Math.floor(Math.random() * 10) + 85,
    complianceStatus: 'Compliant' as const,
    overhaulDue: idx === 2,
  }));
};

// Generate STP data
export const generateSTPData = (): STPOperationalData[] => {
  return STP_STATIONS.map((station) => ({
    ...station,
    inlet: {
      bod: 180 + Math.floor(Math.random() * 40),
      cod: 350 + Math.floor(Math.random() * 80),
      tss: 220 + Math.floor(Math.random() * 50),
      ph: 7.2 + Math.random() * 0.6,
    },
    outlet: {
      bod: 15 + Math.floor(Math.random() * 10),
      cod: 80 + Math.floor(Math.random() * 30),
      tss: 20 + Math.floor(Math.random() * 10),
      ph: 7.0 + Math.random() * 0.4,
      compliance: true,
    },
    processParameters: {
      aerationTime: 6 + Math.random() * 2,
      sludgeAge: 12 + Math.floor(Math.random() * 6),
      mlss: 3000 + Math.floor(Math.random() * 500),
    },
    sludge: {
      generated: 2.5 + Math.random(),
      disposed: 2.2 + Math.random() * 0.5,
      pending: 0.3 + Math.random() * 0.3,
    },
    energy: {
      consumption: 850 + Math.floor(Math.random() * 150),
      cost: 5500 + Math.floor(Math.random() * 1000),
    },
    chemicals: {
      chlorine: 25 + Math.floor(Math.random() * 10),
      polymer: 8 + Math.floor(Math.random() * 4),
    },
    faultCount: Math.floor(Math.random() * 2),
    pollutionRisk: 'Low',
    escalations: Math.floor(Math.random() * 2),
    compliancePercent: 94 + Math.floor(Math.random() * 5),
    legalRisk: 'Low',
    environmentalRisk: 'Low',
  }));
};

// Finance data
export interface FinanceData {
  annualBudget: number;
  spent: number;
  variance: number;
  maintenanceCost: number;
  emergencySpend: number;
  contractorPayments: number;
  energyCost: number;
  chemicalCost: number;
  replacementRecommendations: { item: string; cost: number; priority: string }[];
}

export const generateFinanceData = (): FinanceData => ({
  annualBudget: 15000000,
  spent: 9850000,
  variance: 5150000,
  maintenanceCost: 4200000,
  emergencySpend: 850000,
  contractorPayments: 2800000,
  energyCost: 1500000,
  chemicalCost: 500000,
  replacementRecommendations: [
    { item: 'Pump Motor - LS Kothankulam', cost: 250000, priority: 'High' },
    { item: 'VFD - PS Zone 2', cost: 180000, priority: 'Medium' },
    { item: 'Flow Meter - STP Inlet', cost: 75000, priority: 'Low' },
    { item: 'SCADA Panel Upgrade', cost: 450000, priority: 'Medium' },
  ],
});

// Chart data helpers
export const getComplaintsByWard = (complaints: Complaint[]) => {
  const wardData: { [key: number]: number } = {};
  complaints.forEach(c => {
    wardData[c.wardNumber] = (wardData[c.wardNumber] || 0) + 1;
  });

  return Object.entries(wardData)
    .map(([ward, count]) => ({ ward: `Ward ${ward}`, count }))
    .sort((a, b) => Number(a.ward.split(' ')[1]) - Number(b.ward.split(' ')[1]));
};


export const getComplaintsByType = (complaints: Complaint[]) => {
  const typeData: { [key: string]: number } = {};
  complaints.forEach(c => {
    typeData[c.type] = (typeData[c.type] || 0) + 1;
  });
  return Object.entries(typeData).map(([type, count]) => ({ type, count }));
};

export const getComplaintsByStatus = (complaints: Complaint[]) => {
  const statusData: { [key: string]: number } = {};
  complaints.forEach(c => {
    statusData[c.status] = (statusData[c.status] || 0) + 1;
  });
  return Object.entries(statusData).map(([status, count]) => ({ status, count }));
};

export const getSLATrend = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    compliance: Math.floor(Math.random() * 15) + 80,
    breached: Math.floor(Math.random() * 10) + 2,
  }));
};

export const getEnergyTrend = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    lifting: Math.floor(Math.random() * 200) + 400,
    pumping: Math.floor(Math.random() * 300) + 600,
    stp: Math.floor(Math.random() * 150) + 800,
  }));
};

/* ================= SINGLETON DATA ================= */

let COMPLAINTS_CACHE: Complaint[] | null = null;

export const getComplaints = (): Complaint[] => {
  if (!COMPLAINTS_CACHE) {
    COMPLAINTS_CACHE = generateComplaints();
  }
  return COMPLAINTS_CACHE;
};

