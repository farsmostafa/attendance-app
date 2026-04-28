import "./global.css";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { User } from "./types";
import { getCurrentUserData } from "./services/authService";
import { countPresentToday } from "./services/attendanceService";
import LoginScreen from "./LoginScreen";
import EmployeeDashboard from "./EmployeeDashboard";
import AttendanceHistory from "./AttendanceHistory";
import EmployeeProfile from "./EmployeeProfile";
import AddEmployeeContent from "./screens/AddEmployeeContent";
import DashboardContent from "./screens/DashboardContent";
import EmployeeListContent from "./screens/EmployeeListContent";
import AdminSettingsContent from "./screens/AdminSettingsContent";
import AttendanceLogsContent from "./screens/AttendanceLogsContent";
import TodayLogContent from "./screens/TodayLogContent";
import PendingRequestsContent from "./screens/PendingRequestsContent";
import AdminReportsContent from "./screens/AdminReportsContent";
import AdminLayout from "./components/AdminLayout";
import EmployeeLayout from "./components/EmployeeLayout";
import { getCurrentCairoDateString } from "./utils/timeUtils";

import { Platform } from 'react-native';

// Ø§Ù„Ø­Ù‚Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ø³ØªØ§ÙŠÙ„ Ø§Ù„Ù…ØªØµÙØ­ Ù„Ù…Ù†Ø¹ Ø¸Ù‡ÙˆØ± Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø£Ø¨ÙŠØ¶
if (Platform.OS === 'web') {
  document.documentElement.style.backgroundColor = '#1f2029';
  document.body.style.backgroundColor = '#1f2029';
  document.body.style.overscrollBehavior = 'none'; // Ù„Ù…Ù†Ø¹ ØªØ£Ø«ÙŠØ± Ø§Ù„ØªÙ…Ø·Ø· Ø¨Ø§Ù„ÙƒØ§Ù…Ù„

  // iOS Safari specific: zero-out the bottom safe area that the browser injects
  // via env(safe-area-inset-bottom) into React Native Web's root div.
  // Without this, a blank gap appears at the bottom on iPhones in Safari.
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --safe-area-inset-bottom: 0px !important;
    }
    #root, body > div {
      padding-bottom: 0 !important;
      height: 100dvh !important;
    }
  `;
  document.head.appendChild(style);
}

type AppStackParamList = {
  Login: undefined;
  AdminDashboard: undefined;
  AttendanceLogs: undefined;
  EmployeeList: undefined;
  AddEmployee: undefined;
  TodayLog: undefined;
  PendingRequests: undefined;
  AdminReports: undefined;
  AdminSettings: undefined;
  EmployeeDashboard: undefined;
  AttendanceHistory: undefined;
  EmployeeProfile: undefined;
};

type AdminScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "AdminDashboard" | "EmployeeList" | "AddEmployee" | "AdminSettings" | "AttendanceLogs" | "TodayLog" | "PendingRequests" | "AdminReports"
>;
type EmployeeScreenProps = NativeStackScreenProps<AppStackParamList, "EmployeeDashboard" | "AttendanceHistory" | "EmployeeProfile">;

const Stack = createNativeStackNavigator<AppStackParamList>();

interface AppState {
  user: User | null;
  userRole: "admin" | "employee" | null;
  loading: boolean;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

const AdminDashboardScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [presentToday, setPresentToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await getCurrentUserData();
        const resolvedCompanyId = userData?.companyId || userData?.company_id || "";

        const employeesQuery = query(
          collection(db, "users"),
          where("companyId", "==", resolvedCompanyId),
          where("role", "==", "employee"),
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeeRows: Employee[] = [];
        employeesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          employeeRows.push({
            id: docSnapshot.id,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "employee",
            company_id: data.companyId || resolvedCompanyId,
          });
        });
        setEmployees(employeeRows);

        const today = getCurrentCairoDateString();
        const presentCount = await countPresentToday(today);
        setPresentToday(presentCount);
      } catch (loadError) {
        console.error("Error loading admin dashboard:", loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load admin dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AdminDashboard" showLoading={loading}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <DashboardContent employees={employees} presentToday={presentToday} onViewAllAttendance={() => navigation.navigate("AttendanceLogs" as never)} />
      )}
    </AdminLayout>
  );
};

const EmployeeManagementScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="EmployeeList" showLoading={loading}>
      <EmployeeListContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const AddEmployeeScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="EmployeeList" showLoading={loading}>
      <AddEmployeeContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const AttendanceLogsScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AttendanceLogs" showLoading={loading}>
      <AttendanceLogsContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const TodayLogScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AttendanceLogs" showLoading={loading}>
      <TodayLogContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const PendingRequestsScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AttendanceLogs" showLoading={loading}>
      <PendingRequestsContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const AdminReportsScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AdminDashboard" showLoading={loading}>
      <AdminReportsContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const GeneralSettingsScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const userData = await getCurrentUserData();
        setCompanyId(userData?.companyId || userData?.company_id || "");
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AdminSettings" showLoading={loading}>
      <AdminSettingsContent navigation={navigation as any} companyId={companyId} />
    </AdminLayout>
  );
};

const EmployeeDashboardScreen: React.FC<EmployeeScreenProps> = ({ navigation, route }) => {
  return (
    <EmployeeLayout navigation={navigation} activeRoute="EmployeeDashboard">
      <EmployeeDashboard {...({ navigation, route } as any)} isFocused />
    </EmployeeLayout>
  );
};

const EmployeeHistoryScreen: React.FC<EmployeeScreenProps> = ({ navigation, route }) => {
  return (
    <EmployeeLayout navigation={navigation} activeRoute="AttendanceHistory">
      <AttendanceHistory {...({ navigation, route } as any)} isFocused />
    </EmployeeLayout>
  );
};


function EmployeeStack() {
  return (
    <Stack.Navigator
      initialRouteName="EmployeeDashboard"
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} />
      <Stack.Screen name="AttendanceHistory" component={EmployeeHistoryScreen} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfile} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="EmployeeList" component={EmployeeManagementScreen} />
      <Stack.Screen name="AttendanceLogs" component={AttendanceLogsScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="TodayLog" component={TodayLogScreen} />
      <Stack.Screen name="PendingRequests" component={PendingRequestsScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminSettings" component={GeneralSettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    user: null,
    userRole: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getCurrentUserData();
          if (userData) {
            setAppState({
              user: userData,
              userRole: userData.role as "admin" | "employee",
              loading: false,
            });
            return;
          }
        }
        setAppState({ user: null, userRole: null, loading: false });
      } catch (error) {
        console.error("Error while resolving auth state:", error);
        setAppState({ user: null, userRole: null, loading: false });
      }
    });

    return unsubscribe;
  }, []);

  if (appState.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2a2b38" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!appState.user ? <AuthStack /> : appState.userRole === "admin" ? <AdminStack /> : <EmployeeStack />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#444",
  },
  errorBox: {
    backgroundColor: "#ffecec",
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    color: "#9f1d1d",
    fontSize: 14,
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2a2b38",
    marginBottom: 6,
  },
  profileRow: {
    fontSize: 15,
    color: "#333",
  },
});
