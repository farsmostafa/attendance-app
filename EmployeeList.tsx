import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { getCurrentUserData } from "./services/authService";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

type EmployeeListProps = NativeStackScreenProps<RootStackParamList, "EmployeeList">;

interface Employee {
  id: string;
  name: string;
  email: string;
  basic_salary: number;
  role: string;
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

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.tableCell, styles.nameColumn]}>
        <Text style={styles.headerText}>الاسم</Text>
      </View>
      <View style={[styles.tableCell, styles.emailColumn]}>
        <Text style={styles.headerText}>البريد الإلكتروني</Text>
      </View>
      <View style={[styles.tableCell, styles.salaryColumn]}>
        <Text style={styles.headerText}>الراتب</Text>
      </View>
    </View>
  );

  const renderEmployeeRow = ({ item, index }: { item: Employee; index: number }) => {
    // Safe null checks - return nothing if no valid item
    if (!item?.id) {
      return null;
    }

    const employeeName = item?.name || "غير محدد";
    const employeeEmail = item?.email || "غير محدد";
    const salary = item?.basic_salary ?? 0;

    return (
      <TouchableOpacity
        style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
        onPress={() => handleEmployeePress(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.tableCell, styles.nameColumn]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {employeeName}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.emailColumn]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {employeeEmail}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.salaryColumn]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {typeof salary === "number" ? salary.toLocaleString("ar-EG") : "0"}
          </Text>
        </View>
      </TouchableOpacity>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>قائمة الموظفين</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري تحميل الموظفين...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>قائمة الموظفين</Text>
        </View>
        {renderErrorState()}
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Table */}
      {employees && employees.length > 0 ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={employees}
            renderItem={renderEmployeeRow}
            keyExtractor={(item, index) => (item?.id ? item.id : `employee-${index}`)}
            scrollEnabled={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: "row-reverse",
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#005fa3",
  },
  tableRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowEven: {
    backgroundColor: "#fff",
  },
  rowOdd: {
    backgroundColor: "#f9f9f9",
  },
  tableCell: {
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  nameColumn: {
    flex: 1.2,
  },
  emailColumn: {
    flex: 1.5,
  },
  salaryColumn: {
    flex: 0.8,
    alignItems: "flex-end",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  cellText: {
    fontSize: 13,
    color: "#333",
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
