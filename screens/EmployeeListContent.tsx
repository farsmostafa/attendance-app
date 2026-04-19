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
  joinDate: string;
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
      <View style={styles.cardTopRow}>
        <View style={styles.statusRow}>
          <View style={styles.activeDot} />
          <Text style={styles.activeLabel}>Active</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.largeAvatar}>
          <Text style={styles.largeAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.employeeNameLarge}>{item.name}</Text>
        <Text style={styles.departmentLarge}>{item.department}</Text>
      </View>

      <View style={styles.contactBox}>
        <View style={styles.contactRow}>
          <Ionicons name="mail" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{item.email}</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{item.phone || "غير محدد"}</Text>
        </View>
      </View>

      <View style={styles.cardBottomRow}>
        <Text style={styles.joinedText}>انضم {item.joinDate || "غير معروف"}</Text>
        <Text style={styles.viewDetails}>عرض التفاصيل {">"}</Text>
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

      {/* Employees Grid with Max Width Container */}
      <View style={styles.gridContainer}>
        <ScrollView contentContainerStyle={styles.gridRow} showsVerticalScrollIndicator={false}>
          {employees.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              {renderEmployeeCard({ item })}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  gridContainer: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
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
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 16,
    paddingBottom: 20,
  },
  cardWrapper: {
    width: 300,
    marginRight: 16,
    marginBottom: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  activeLabel: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  largeAvatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  employeeNameLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  departmentLarge: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  contactBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  contactText: {
    color: "#374151",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinedText: {
    color: "#6b7280",
    fontSize: 12,
  },
  viewDetails: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
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
