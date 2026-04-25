import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { RootStackParamList } from "./types";
import { getCurrentUserData } from "./services/authService";
import { countPresentToday } from "./services/attendanceService";
import AdminLayout from "./components/AdminLayout";
import DashboardContent from "./screens/DashboardContent";

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
  const [presentToday, setPresentToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userData = await getCurrentUserData();
        const companyId = userData?.companyId || userData?.company_id || "MainCompany";

        const employeesQuery = query(collection(db, "users"), where("companyId", "==", companyId), where("role", "==", "employee"));
        const employeesSnapshot = await getDocs(employeesQuery);

        const employeeRows: Employee[] = [];
        employeesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          employeeRows.push({
            id: docSnapshot.id,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "employee",
            company_id: data.companyId || companyId,
          });
        });

        const today = new Date().toISOString().split("T")[0];
        const presentCount = await countPresentToday(today);

        setEmployees(employeeRows);
        setPresentToday(presentCount);
      } catch (loadError) {
        console.error("Error loading admin dashboard:", loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load admin dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <AdminLayout navigation={navigation} activeRoute="AdminDashboard" showLoading={loading}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <DashboardContent employees={employees} presentToday={presentToday} onViewAllAttendance={() => navigation.navigate("AddEmployee" as never)} />
      )}
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: "rgba(255,180,171,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.30)",
    borderRadius: 8,
    padding: 16,
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
});

export default AdminDashboard;
