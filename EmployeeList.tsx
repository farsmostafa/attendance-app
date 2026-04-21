import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { getCurrentUserData } from "./services/authService";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import ScreenWrapper from "./components/ScreenWrapper";
import DashboardMenu from "./components/DashboardMenu";

type EmployeeListProps = NativeStackScreenProps<RootStackParamList, "EmployeeList">;

interface Employee {
  id: string;
  name: string;
  email: string;
  basic_salary: number;
  role: string;
  phone?: string;
  department?: string;
  status?: "active" | "inactive";
}

const EmployeeList: React.FC<EmployeeListProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setError(null);
      console.log("Starting to fetch employees...");

      // Get current user data
      const userData = await getCurrentUserData();
      console.log("Current user data:", userData);

      if (!userData) {
        throw new Error("فشل في جلب بيانات المستخدم الحالي");
      }


      if (!userData?.company_id) {
        throw new Error("لم نتمكن من العثور على شركتك");
      }

      console.log("Company ID:", userData.company_id);

      // Query users collection directly with proper filters
      const q = query(collection(db, "users"), where("company_id", "==", userData.company_id), where("role", "==", "employee"));

      const querySnapshot = await getDocs(q);
      console.log("Query snapshot size:", querySnapshot.size);

      const fetchedEmployees: Employee[] = [];

      querySnapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          console.log("Employee doc data:", data);

          // Safely extract data with defaults
          const employee: Employee = {
            id: docSnapshot.id || "",
            name: data?.name || "غير محدد",
            email: data?.email || "غير محدد",
            basic_salary: Number(data?.basic_salary) || 0,
            role: data?.role || "employee",
            phone: data?.phone || "--",
            department: data?.department || "غير محدد",
            status: data?.status || "active",
          };

          // Only add if we have valid ID
          if (employee.id) {
            fetchedEmployees.push(employee);
          }
        } catch (docError) {
          console.error("Error processing employee doc:", docError);
        }
      });

      console.log("Fetched employees count:", fetchedEmployees.length);
      setEmployees(fetchedEmployees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      const errorMessage = error?.message || "فشل في جلب بيانات الموظفين. يرجى المحاولة لاحقاً";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("EmployeeList component mounted");
    fetchEmployees();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("EmployeeList screen focused");
      setRefreshing(true);
      fetchEmployees();
    }, []),
  );

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    setRefreshing(true);
    fetchEmployees();
  };

  const handleAddEmployee = () => {
    navigation.navigate("AddEmployee");
  };

  const handleEmployeePress = (employeeId: string) => {
    if (!employeeId) {
      Alert.alert("خطأ", "معرف الموظف غير صحيح");
      return;
    }
    navigation.navigate("EmployeeProfileAdminView", {
      employeeId,
    });
  };

  const handleManageEmployee = (employeeId: string, employeeName: string) => {
    // Placeholder for manage action - can be extended later
    Alert.alert("إدارة الموظف", `إدارة ${employeeName}`);
  };

  const renderEmployeeCard = ({ item, index }: { item: Employee; index: number }) => {
    // Safe null checks - return nothing if no valid item
    if (!item?.id) {
      return null;
    }

    const employeeName = item?.name || "غير محدد";
    const employeeEmail = item?.email || "غير محدد";
    const salary = item?.basic_salary ?? 0;
    const phone = item?.phone || "--";
    const department = item?.department || "غير محدد";
    const isActive = item?.status === "active";
    const initials = employeeName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity style={styles.employeeCard} onPress={() => handleEmployeePress(item.id)} activeOpacity={0.85}>
          {/* Header with Avatar and Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>نشط</Text>
              </View>
            )}
          </View>

          {/* Employee Info */}
          <View style={styles.cardContent}>
            <Text style={styles.employeeName} numberOfLines={1}>
              {employeeName}
            </Text>
            <Text style={styles.employeeEmail} numberOfLines={1}>
              {employeeEmail}
            </Text>

            {/* Department Badge */}
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{department}</Text>
            </View>

            {/* Phone Number */}
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={12} color="#666" />
              <Text style={styles.phoneText}>{phone}</Text>
            </View>

            <View style={styles.salaryContainer}>
              <Text style={styles.salaryLabel}>الراتب:</Text>
              <Text style={styles.salaryValue}>{typeof salary === "number" ? salary.toLocaleString("ar-EG") : "0"} EGP</Text>
            </View>
          </View>

          {/* Manage Button */}
          <TouchableOpacity style={styles.manageButton} onPress={() => handleManageEmployee(item.id, employeeName)} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={16} color="#007bff" />
            <Text style={styles.manageButtonText}>إدارة</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد موظفين بعد</Text>
      <Text style={styles.emptySubtext}>اضغط على الزر "إضافة موظف" لإضافة موظف جديد</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setRefreshing(true);
          fetchEmployees();
        }}
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>حاول مرة أخرى</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <DashboardMenu navigation={navigation} currentScreen="EmployeeList" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري تحميل الموظفين...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <ScreenWrapper>
        <DashboardMenu navigation={navigation} currentScreen="EmployeeList" />
        {renderErrorState()}
      </ScreenWrapper>
    );
  }

  // Success state
  return (
    <ScreenWrapper>
      <DashboardMenu navigation={navigation} currentScreen="EmployeeList" />

      {/* Header with Add Button */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>قائمة الموظفين</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {/* Employee Count */}
      {employees && employees.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>إجمالي الموظفين: {employees.length}</Text>
        </View>
      )}

      {/* Grid */}
      {employees && employees.length > 0 ? (
        <FlatList
          data={employees}
          renderItem={renderEmployeeCard}
          keyExtractor={(item, index) => (item?.id ? item.id : `employee-${index}`)}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={true}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#28a745",
    flexDirection: "row-reverse",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  countContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  countText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  // Grid Layout Styles
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardWrapper: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
    justifyContent: "flex-start",
  },
  employeeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    alignItems: "center",
    minHeight: 280,
    justifyContent: "space-between",
  },
  cardHeader: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  activeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  cardContent: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  employeeEmail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  salaryContainer: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
  },
  salaryLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007bff",
    marginTop: 2,
  },
  departmentBadge: {
    backgroundColor: "#e7f3ff",
    borderWidth: 1,
    borderColor: "#007bff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007bff",
    textAlign: "center",
  },
  phoneContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  manageButton: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#007bff",
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
    width: "100%",
    justifyContent: "center",
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007bff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
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
  errorMessage: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default EmployeeList;
