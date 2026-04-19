import React, { useState, useEffect, useFocusEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { fetchCompanyEmployees } from "./services/adminService";
import { getCurrentUserData } from "./services/authService";
import { Ionicons } from "@expo/vector-icons";

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

  const fetchEmployees = async () => {
    try {
      const userData = await getCurrentUserData();
      if (!userData?.company_id) {
        Alert.alert("خطأ", "لم نتمكن من العثور على شركتك");
        setLoading(false);
        return;
      }

      const data = await fetchCompanyEmployees(userData.company_id);
      setEmployees(data);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في جلب بيانات الموظفين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(true);
      fetchEmployees().then(() => setRefreshing(false));
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees().then(() => setRefreshing(false));
  };

  const handleAddEmployee = () => {
    navigation.navigate("AddEmployee");
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
        <Text style={styles.headerText}>الراتب (EGP)</Text>
      </View>
    </View>
  );

  const renderEmployeeRow = ({ item, index }: { item: Employee; index: number }) => (
    <TouchableOpacity
      style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
      onPress={() =>
        navigation.navigate("EmployeeProfileAdminView", {
          employeeId: item.id,
        })
      }
    >
      <View style={[styles.tableCell, styles.nameColumn]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.emailColumn]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.salaryColumn]}>
        <Text style={styles.cellText}>{item.basic_salary.toLocaleString("ar-EG")}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد موظفين بعد</Text>
      <Text style={styles.emptySubtext}>اضغط على الزر "إضافة موظف" لإضافة موظف جديد</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>قائمة الموظفين</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة موظف</Text>
        </TouchableOpacity>
      </View>

      {/* Employee Count */}
      {employees.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>إجمالي الموظفين: {employees.length}</Text>
        </View>
      )}

      {/* Table */}
      {employees.length > 0 ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={employees}
            renderItem={renderEmployeeRow}
            keyExtractor={(item) => item.id}
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
    paddingHorizontal: 16,
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
});

export default EmployeeList;
