import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchAllAttendanceRecords } from "../services/attendanceService";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  check_in: any;
  check_out?: any;
  isLate: boolean;
  status: "on-time" | "late";
  location: any;
  workDuration?: number;
  userName?: string;
}

interface DashboardContentProps {
  employees: Employee[];
  presentToday?: number;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ employees, presentToday = 0 }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setAttendanceLoading(true);
        const records = await fetchAllAttendanceRecords();
        setAttendanceRecords(records);
      } catch (error) {
        console.error("Error fetching attendance records:", error);
        setAttendanceError("فشل تحميل سجلات الحضور");
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateString;
    }
  };

  const calculateHours = (checkIn: any, checkOut: any, duration?: number) => {
    if (duration !== undefined) {
      return (duration / 60).toFixed(1);
    }
    if (!checkIn || !checkOut) return "—";
    try {
      const checkInTime = checkIn.toDate ? checkIn.toDate() : new Date(checkIn);
      const checkOutTime = checkOut.toDate ? checkOut.toDate() : new Date(checkOut);
      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(1);
    } catch {
      return "—";
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Ionicons name="people" size={32} color="#007bff" />
          <Text style={styles.statValue}>{employees.length}</Text>
          <Text style={styles.statLabel}>عدد الموظفين</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Ionicons name="checkmark-circle" size={32} color="#28a745" />
          <Text style={styles.statValue}>{presentToday}</Text>
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
          <View style={styles.recentEmployeesContainer}>
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
        </View>
      )}

      {/* Attendance Records Table */}
      <View style={styles.attendanceSection}>
        <Text style={styles.sectionTitle}>سجلات الحضور</Text>

        {attendanceLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>جاري تحميل السجلات...</Text>
          </View>
        ) : attendanceError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color="#dc3545" />
            <Text style={styles.errorText}>{attendanceError}</Text>
          </View>
        ) : attendanceRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={32} color="#999" />
            <Text style={styles.emptyText}>لا توجد سجلات حضور</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellName]}>اسم الموظف</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellDate]}>التاريخ</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellTime]}>وقت الحضور</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellTime]}>وقت الانصراف</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellStatus]}>الحالة</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.cellHours]}>الساعات</Text>
            </View>

            {/* Table Rows */}
            {attendanceRecords.map((record, index) => (
              <View key={record.id} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.tableCell, styles.cellName]} numberOfLines={1}>
                  {record.userName || "—"}
                </Text>
                <Text style={[styles.tableCell, styles.cellDate]} numberOfLines={1}>
                  {formatDate(record.date)}
                </Text>
                <Text style={[styles.tableCell, styles.cellTime]} numberOfLines={1}>
                  {formatTime(record.check_in)}
                </Text>
                <Text style={[styles.tableCell, styles.cellTime]} numberOfLines={1}>
                  {formatTime(record.check_out)}
                </Text>
                <View style={[styles.tableCell, styles.cellStatus]}>
                  <Text style={[styles.statusBadge, record.status === "late" ? styles.statusBadgeLate : styles.statusBadgeOnTime]}>
                    {record.status === "late" ? "متأخر" : "في الموعد"}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.cellHours]} numberOfLines={1}>
                  {calculateHours(record.check_in, record.check_out, record.workDuration)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  recentEmployeesContainer: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
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
  attendanceSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#0056b3",
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
    fontSize: 13,
    color: "#333",
    textAlign: "right",
  },
  headerCell: {
    color: "#fff",
    fontWeight: "600",
  },
  cellName: {
    flex: 2,
    marginHorizontal: 4,
  },
  cellDate: {
    flex: 1.2,
    marginHorizontal: 4,
  },
  cellTime: {
    flex: 1,
    marginHorizontal: 4,
  },
  cellStatus: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cellHours: {
    flex: 0.8,
    marginHorizontal: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
  },
  statusBadgeLate: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  statusBadgeOnTime: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
});

export default DashboardContent;
