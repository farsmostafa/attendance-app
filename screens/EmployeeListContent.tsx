import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { fetchCompanyEmployees } from "../services/adminService";

interface EmployeeCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  basicSalary: number;
  status: string;
}

interface Props {
  navigation?: NativeStackNavigationProp<RootStackParamList>;
  companyId: string;
}

const EmployeeListContent: React.FC<Props> = ({ companyId }) => {
  const [employees, setEmployees] = useState<EmployeeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [companyId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompanyEmployees(companyId);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في جلب قائمة الموظفين");
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderEmployeeCard = ({ item }: { item: EmployeeCard }) => (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        {item.status === "active" && <View style={styles.statusBadge} />}
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Phone */}
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#007bff" />
          <Text style={styles.infoLabel}>الهاتف:</Text>
          <Text style={styles.infoValue}>{item.phone || "غير محدد"}</Text>
        </View>

        {/* Email */}
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={16} color="#007bff" />
          <Text style={styles.infoLabel}>البريد:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Salary */}
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color="#28a745" />
          <Text style={styles.infoLabel}>الراتب:</Text>
          <Text style={[styles.infoValue, styles.salaryValue]}>LE {item.basicSalary.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>جاري تحميل الموظفين...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="people" size={48} color="#ccc" />
        <Text style={styles.emptyText}>لا توجد موظفين بعد</Text>
        <Text style={styles.emptySubText}>ابدأ بإضافة موظف جديد من قسم "إضافة موظف"</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>قائمة الموظفين</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{employees.length}</Text>
            <Text style={styles.statLabel}>إجمالي الموظفين</Text>
          </View>
        </View>
      </View>

      {/* Employees Grid */}
      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "right",
  },
  statsContainer: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "right",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
  },
  department: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    textAlign: "right",
  },
  statusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#28a745",
  },
  cardBody: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    minWidth: 50,
    textAlign: "right",
  },
  infoValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  salaryValue: {
    color: "#28a745",
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: "#dc3545",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubText: {
    marginTop: 6,
    color: "#bbb",
    fontSize: 13,
    textAlign: "center",
  },
});

export default EmployeeListContent;
