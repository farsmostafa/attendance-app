// User interface for type safety
export interface User {
  uid: string;
  name?: string;
  email?: string;
  role: "admin" | "employee";
  company_id?: string;
  id?: string;
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

// Navigation prop types for React Navigation
export type RootStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  AddEmployee: undefined;
  EmployeeList: undefined;
  TodayLog: undefined;
  EmployeeProfileAdminView: { employeeId: string };
  PendingRequests: undefined;
  EmployeeTabs: undefined;
  AttendanceHistory: undefined;
};

// Employee details for dashboard
export interface EmployeeDetails extends User {
  base_salary?: number;
  attendance?: AttendanceRecord[];
}

// Attendance record
export interface AttendanceRecord {
  check_in: string;
  check_out?: string;
  date: string;
  [key: string]: any;
}
