// User interface for type safety
// User interface for type safety
export interface User {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  joinDate?: string; // ISO date string (YYYY-MM-DD)
  status?: "active" | "inactive";
  workStartTime?: string; // Format: HH:mm (e.g., "09:00")
  workEndTime?: string; // Format: HH:mm (e.g., "17:00")
  basicSalary?: number | string; // Allow string just in case it comes from inputs
  role: "admin" | "employee";
  company_id?: string;
  id?: string;

  // --- الحقول الجديدة المطلوبة لمنع أخطاء TypeScript ---
  avatarUrl?: string | null;
  salary?: number | string;
  checkInTime?: string;
  checkOutTime?: string;

  [key: string]: any; // Allow additional Firestore fields
}
// Firebase error interface
export interface FirebaseErrorType extends Error {
  code?: string;
  message: string;
}

// Authentication context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

// Bottom Tab Navigation for Employee
export type EmployeeTabParamList = {
  EmployeeDashboard: undefined;
  AttendanceHistory: undefined;
  Requests: undefined;
};

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Navigation prop types for React Navigation
export type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  AttendanceLogs: undefined;
  AddEmployee: undefined;
  EmployeeList: undefined;
  TodayLog: undefined;
  EmployeeProfileAdminView: { employeeId: string };
  PendingRequests: undefined;
  AdminSettings: undefined;
  AdminReports: undefined;
  EmployeeTabs: undefined;
  EmployeeDashboard: undefined;
  AttendanceHistory: undefined;
  Requests: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;

// Employee details for dashboard
export interface EmployeeDetails extends User {
  basicSalary?: number;
  attendance?: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  financialRecords?: FinancialRecord[];
}

// Attendance record
export interface AttendanceRecord {
  id?: string;
  userId?: string;
  check_in: any;
  check_out?: any;
  date: string; // Format: YYYY-MM-DD
  workDuration?: number; // In minutes
  isLate?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any;
}

// Leave Request interface
export interface LeaveRequest {
  id: string;
  userId: string;
  type: "sick" | "vacation" | "personal" | "unpaid" | "other";
  status: "pending" | "approved" | "rejected" | "cancelled";
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  reason: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Financial Record interface
export interface FinancialRecord {
  id: string;
  userId: string;
  type: "bonus" | "deduction" | "salary" | "allowance" | "other";
  amount: number;
  reason: string;
  timestamp: string; // ISO timestamp
  processedBy?: string;
  notes?: string;
  month?: string; // Format: YYYY-MM for monthly records
  [key: string]: any;
}

// Location data interface (for geo-tracking)
export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: string;
}

// Payroll Summary interface (for financial reports)
export interface PayrollSummary {
  userId: string;
  month: string; // Format: YYYY-MM
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  attendanceBonus?: number;
  notes?: string;
  generatedAt?: string;
}

// Attendance Summary interface (for reports)
export interface AttendanceSummary {
  userId: string;
  month: string; // Format: YYYY-MM
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveCount: number;
  attendanceRate: number; // Percentage
}
