import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

interface DashboardContentProps {
  employees: Employee[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({ employees }) => {
  return (
    <View style={styles.container}>
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

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>مرحباً بك في لوحة التحكم</Text>
        <Text style={styles.welcomeSubtitle}>استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة</Text>
      </View>

      {/* Recent Employees Section */}
      {employees.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>الموظفون الأخيرون</Text>
          <View style={styles.recentEmployeesList}>
            {employees.slice(0, 5).map((emp, index) => (
              <View key={emp.id} style={[styles.employeeCard, index === employees.slice(0, 5).length - 1 && styles.lastCard]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsSection: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 20,
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
  welcomeSection: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
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
  lastCard: {
    borderBottomWidth: 0,
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
});

export default DashboardContent;
