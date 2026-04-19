import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getCurrentUserData } from "./services/authService";
import { User, RootStackParamList } from "./types";
import AdminLayout from "./components/AdminLayout";

// Content components
import DashboardContent from "./screens/DashboardContent";
import AddEmployeeContent from "./screens/AddEmployeeContent";
import EmployeeListContent from "./screens/EmployeeListContent";
import TodayLogContent from "./screens/TodayLogContent";
import PendingRequestsContent from "./screens/PendingRequestsContent";
import AdminReportsContent from "./screens/AdminReportsContent";
import AdminSettingsContent from "./screens/AdminSettingsContent";

type AdminDashboardProps = NativeStackScreenProps<RootStackParamList, "AdminDashboard">;

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>("Dashboard");
  const [companyId, setCompanyId] = useState<string>("MainCompany");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUserData();
        setCurrentUser(userData);

        if (!userData) {
          setError("فشل في تحميل بيانات المستخدم");
          setLoading(false);
          return;
        }

        // Use user's company_id or default
        const company = userData.company_id || "MainCompany";
        setCompanyId(company);

        // Fetch employees for the company
        const q = query(collection(db, "users"), where("company_id", "==", company), where("role", "==", "employee"));
        const querySnapshot = await getDocs(q);
        const empList: Employee[] = [];
        querySnapshot.forEach((doc) => {
          empList.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(empList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen);
  };

  if (loading) {
    return (
      <AdminLayout
        currentScreen={activeScreen}
        onNavigate={handleScreenChange}
        showLoading={true}
        userName={currentUser?.name}
        navigation={navigation}
      >
        <View />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        currentScreen={activeScreen}
        onNavigate={handleScreenChange}
        showLoading={false}
        userName={currentUser?.name}
        navigation={navigation}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </AdminLayout>
    );
  }

  // Render content based on active screen
  const renderContent = () => {
    switch (activeScreen) {
      case "Dashboard":
        return <DashboardContent employees={employees} />;
      case "AddEmployee":
        return <AddEmployeeContent navigation={navigation} companyId={companyId} />;
      case "EmployeeList":
        return <EmployeeListContent navigation={navigation} companyId={companyId} />;
      case "TodayLog":
        return <TodayLogContent navigation={navigation} companyId={companyId} />;
      case "PendingRequests":
        return <PendingRequestsContent navigation={navigation} companyId={companyId} />;
      case "AdminReports":
        return <AdminReportsContent navigation={navigation} companyId={companyId} />;
      case "AdminSettings":
        return <AdminSettingsContent navigation={navigation} companyId={companyId} />;
      default:
        return <DashboardContent employees={employees} />;
    }
  };

  return (
    <AdminLayout
      currentScreen={activeScreen}
      onNavigate={handleScreenChange}
      showLoading={false}
      userName={currentUser?.name}
      navigation={navigation}
    >
      {renderContent()}
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 12,
  },
});

export default AdminDashboard;
