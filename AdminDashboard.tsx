import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getCurrentUserData } from "./services/authService";
import { User, RootStackParamList } from "./types";

type AdminDashboardProps = NativeStackScreenProps<RootStackParamList, "AdminDashboard">;

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

interface AdminMenuOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "settings">("overview");

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

        // Check if company_id exists and is valid
        const companyId = userData.company_id;
        if (!companyId || companyId.trim() === "") {
          setHasCompany(false);
          setLoading(false);
          return;
        }

        // Only run query if company_id is valid
        const q = query(collection(db, "users"), where("company_id", "==", companyId), where("role", "==", "employee"));
        const querySnapshot = await getDocs(q);
        const empList: Employee[] = [];
        querySnapshot.forEach((doc) => {
          empList.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(empList);
        setHasCompany(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  const menuOptions: AdminMenuOption[] = [
    {
      id: "add-employee",
      label: "إضافة موظف",
      icon: "person-add",
      color: "#28a745",
      onPress: () => navigation.navigate("AddEmployee"),
    },
    {
      id: "employee-list",
      label: "قائمة الموظفين",
      icon: "people",
      color: "#007bff",
      onPress: () => navigation.navigate("EmployeeList"),
    },
    {
      id: "today-log",
      label: "سجل اليوم",
      icon: "calendar-today",
      color: "#dc3545",
      onPress: () => navigation.navigate("TodayLog"),
    },
    {
      id: "pending-requests",
      label: "الطلبات المعلقة",
      icon: "document-text",
      color: "#6f42c1",
      onPress: () => navigation.navigate("PendingRequests"),
    },
    {
      id: "reports",
      label: "التقارير",
      icon: "bar-chart",
      color: "#ffc107",
      onPress: () => Alert.alert("قريباً", "قريباً ستتوفر التقارير"),
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: "settings",
      color: "#6c757d",
      onPress: () => Alert.alert("قريباً", "قريباً ستتوفر الإعدادات"),
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!hasCompany) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
        </View>
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.messageText}>يرجى ربط حسابك بشركة</Text>
          <Text style={styles.messageSubtext}>لعرض وإدارة الموظفين</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="close-circle-outline" size={48} color="#cc0000" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <Text style={styles.adminName}>مرحباً، {currentUser?.name || "مسؤول"}</Text>
        </View>
        <Ionicons name="shield-checkmark" size={32} color="#007bff" />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Ionicons name="people" size={32} color="#007bff" />
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>عدد الموظفين</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Ionicons name="checkmark-circle" size={32} color="#28a745" />
            <Text style={styles.statValue}>{Math.floor(employees.length * 0.8)}</Text>
            <Text style={styles.statLabel}>حاضرون اليوم</Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
          <View style={styles.menuGrid}>
            {menuOptions.map((option) => (
              <TouchableOpacity key={option.id} style={styles.menuItem} onPress={option.onPress}>
                <View style={[styles.menuIconContainer, { backgroundColor: option.color + "20" }]}>
                  <Ionicons name={option.icon} size={28} color={option.color} />
                </View>
                <Text style={styles.menuLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Employees Section */}
        {employees.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الموظفون الأخيرون</Text>
              <TouchableOpacity onPress={() => navigation.navigate("EmployeeList")}>
                <Text style={styles.viewAllLink}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentEmployeesList}>
              {employees.slice(0, 3).map((emp) => (
                <View key={emp.id} style={styles.employeeCard}>
                  <View style={styles.employeeAvatar}>
                    <Text style={styles.avatarText}>{emp.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{emp.name}</Text>
                    <Text style={styles.employeeEmail}>{emp.email}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerBar: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  adminName: {
    fontSize: 12,
    color: "#e3f2fd",
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsSection: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statCardBlue: {
    backgroundColor: "#e3f2fd",
  },
  statCardGreen: {
    backgroundColor: "#f0f9f0",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllLink: {
    fontSize: 12,
    color: "#007bff",
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
  },
  menuItem: {
    width: "48%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  recentEmployeesList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  employeeCard: {
    flexDirection: "row-reverse",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  employeeEmail: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  messageSubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#cc0000",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },
});

export default AdminDashboard;
