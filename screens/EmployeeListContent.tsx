import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackNavigationProp } from "../types";
import { fetchCompanyEmployees } from "../services/adminService";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#1f2029",
  surface: "#2a2b38",
  surfaceElevated: "#32333f",
  border: "rgba(255,235,167,0.10)",
  accent: "#ffeba7",
  accentDim: "rgba(255,235,167,0.15)",
  accentBorder: "rgba(255,235,167,0.30)",
  textPrimary: "#e7e2da",
  textSecondary: "#969081",
  error: "#ffb4ab",
  errorDim: "rgba(255,180,171,0.10)",
  errorBorder: "rgba(255,180,171,0.30)",
};

interface EmployeeCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  basicSalary: number;
  status: string;
  joinDate?: string;
}

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

const EmployeeListContent: React.FC<Props> = ({ companyId }) => {
  const [employees, setEmployees] = useState<EmployeeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

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
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>جاري تحميل الموظفين...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={C.error} />
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
      {/* ── Page Header ── */}
      <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
        <Text style={styles.pageTitle}>إدارة الموظفين</Text>
        <Text style={styles.pageSubtitle}>عرض وإدارة حسابات الموظفين</Text>
      </View>

      {/* ── Stats Strip ── */}
      <View style={styles.statsStrip}>
        <View style={styles.statPill}>
          <Ionicons name="people-outline" size={16} color={C.accent} />
          <Text style={styles.statPillText}>{employees.length} موظف</Text>
        </View>
      </View>

      {/* ── Employees Grid ── */}
      <View style={styles.gridContainer}>
        <ScrollView contentContainerStyle={styles.gridRow} showsVerticalScrollIndicator={false}>
          {employees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color={C.textSecondary} />
              <Text style={styles.emptyText}>لا توجد موظفين بعد</Text>
              <Text style={styles.emptySubText}>ابدأ بإضافة موظف جديد من قسم “إضافة موظف”</Text>
            </View>
          ) : (
            employees.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                {renderEmployeeCard({ item })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* ── Page Header ── */
  pageHeader: {
    marginBottom: 24,
    paddingRight: 0,
  },
  pageHeaderMobile: {
    paddingRight: 56, // ensures text wraps instead of colliding with burger
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "right",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "right",
    fontWeight: "500",
  },
  /* ── Stats Strip ── */
  statsStrip: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statPillText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  /* ── Grid ── */
  gridContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    width: 300,
  },
  /* ── Employee Card ── */
  card: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 16,
    overflow: "hidden",
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
    backgroundColor: C.accent,
  },
  activeLabel: {
    fontSize: 12,
    color: C.accent,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  largeAvatarText: {
    color: C.accent,
    fontSize: 26,
    fontWeight: "bold",
  },
  employeeNameLarge: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  departmentLarge: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: "center",
  },
  contactBox: {
    backgroundColor: C.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    color: C.textSecondary,
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  cardBottomRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinedText: {
    color: C.textSecondary,
    fontSize: 11,
  },
  viewDetails: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  /* ── States ── */
  loadingText: {
    marginTop: 12,
    color: C.textSecondary,
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: C.error,
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
    width: "100%",
  },
  emptyText: {
    marginTop: 4,
    color: C.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubText: {
    color: C.textSecondary,
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default EmployeeListContent;
