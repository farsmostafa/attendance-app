import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { RootStackParamList } from "./types";

type TodayLogProps = NativeStackScreenProps<RootStackParamList, "TodayLog">;

interface Employee {
  id: string;
  name: string;
  email: string;
  basic_salary: number;
}

interface AttendanceRecord {
  userId: string;
  type: "check-in" | "check-out";
  timestamp: Timestamp;
}

interface TodayAttendance {
  employeeId: string;
  employeeName: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: "Present" | "Absent";
  checkInTimestamp?: Date;
  checkOutTimestamp?: Date;
}

const TodayLog: React.FC<TodayLogProps> = ({ navigation }) => {
  const [todayData, setTodayData] = useState<TodayAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const setupRealtimeUpdates = async () => {
      try {
        const userData = await getCurrentUserData();
        if (!userData?.companyId) {
          Alert.alert("خطأ", "لم نتمكن من العثور على شركتك");
          setLoading(false);
          return;
        }

        // Fetch all employees for the company
        const employeesQuery = query(
          collection(db, "users"),
          where("companyId", "==", userData.companyId),
          where("role", "==", "employee"),
        );

        const employeesSnapshot = await getDocs(employeesQuery);
        const employees = new Map<string, Employee>();

        employeesSnapshot.forEach((doc) => {
          const data = doc.data();
          employees.set(doc.id, {
            id: doc.id,
            name: data.name || "",
            email: data.email || "",
            basic_salary: data.basic_salary || 0,
          });
        });

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStart = Timestamp.fromDate(today);
        const tomorrowStart = Timestamp.fromDate(tomorrow);

        // Collect employee IDs
        const employeeIds = Array.from(employees.keys());

        if (employeeIds.length === 0) {
          // No employees, just show empty state
          setTodayData([]);
          setLoading(false);
          return () => {};
        }

        // Create real-time listener for attendance records
        // Query all attendance records and filter by employee IDs
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("timestamp", ">=", todayStart),
          where("timestamp", "<", tomorrowStart),
        );

        const unsubscribe = onSnapshot(
          attendanceQuery,
          (querySnapshot) => {
            // Group attendance records by employee
            const attendanceByEmployee = new Map<string, AttendanceRecord[]>();

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const userId = data.userId;

              // Only include records for employees in our company
              if (!employeeIds.includes(userId)) {
                return;
              }

              if (!attendanceByEmployee.has(userId)) {
                attendanceByEmployee.set(userId, []);
              }

              const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);

              attendanceByEmployee.get(userId)!.push({
                userId,
                type: data.type,
                timestamp: Timestamp.fromDate(timestamp),
              });
            });

            // Build today's attendance data
            const todayAttendance: TodayAttendance[] = Array.from(employees.values()).map((emp) => {
              const records = attendanceByEmployee.get(emp.id) || [];

              // Sort records by timestamp
              records.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

              // Get first check-in and last check-out
              const checkIn = records.find((r) => r.type === "check-in");
              const checkOut = records.find((r) => r.type === "check-out");

              const checkInDate = checkIn ? checkIn.timestamp.toDate() : undefined;
              const checkOutDate = checkOut ? checkOut.timestamp.toDate() : undefined;

              const checkInTime = checkInDate
                ? checkInDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-";

              const checkOutTime = checkOutDate
                ? checkOutDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-";

              return {
                employeeId: emp.id,
                employeeName: emp.name,
                checkInTime,
                checkOutTime,
                status: checkIn ? "Present" : "Absent",
                checkInTimestamp: checkInDate,
                checkOutTimestamp: checkOutDate,
              };
            });

            // Sort by name
            todayAttendance.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

            setTodayData(todayAttendance);
            setLoading(false);
          },
          (error) => {
            console.error("Error setting up real-time listener:", error);
            Alert.alert("خطأ", error.message || "فشل في تحميل بيانات الحضور");
            setLoading(false);
          },
        );

        return () => unsubscribe();
      } catch (error: any) {
        console.error("Error in setupRealtimeUpdates:", error);
        Alert.alert("خطأ", error.message || "حدث خطأ أثناء تحميل البيانات");
        setLoading(false);
      }
    };

    const cleanup = setupRealtimeUpdates();

    return () => {
      cleanup?.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically refresh the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.tableCell, styles.nameColumn]}>
        <Text style={styles.headerText}>الاسم</Text>
      </View>
      <View style={[styles.tableCell, styles.checkInColumn]}>
        <Text style={styles.headerText}>الحضور</Text>
      </View>
      <View style={[styles.tableCell, styles.checkOutColumn]}>
        <Text style={styles.headerText}>الانصراف</Text>
      </View>
      <View style={[styles.tableCell, styles.statusColumn]}>
        <Text style={styles.headerText}>الحالة</Text>
      </View>
    </View>
  );

  const getRowStyle = (status: string) => {
    if (status === "Present") {
      return styles.rowPresent;
    } else {
      return styles.rowAbsent;
    }
  };

  const renderAttendanceRow = ({ item }: { item: TodayAttendance }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("EmployeeProfileAdminView", {
          employeeId: item.employeeId,
        })
      }
    >
      <View style={[styles.tableRow, getRowStyle(item.status)]}>
        <View style={[styles.tableCell, styles.nameColumn]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {item.employeeName}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.checkInColumn]}>
          <Text style={styles.cellText}>{item.checkInTime}</Text>
        </View>
        <View style={[styles.tableCell, styles.checkOutColumn]}>
          <Text style={styles.cellText}>{item.checkOutTime}</Text>
        </View>
        <View style={[styles.tableCell, styles.statusColumn]}>
          <View style={[styles.statusBadge, item.status === "Present" ? styles.statusBadgePresent : styles.statusBadgeAbsent]}>
            <Ionicons
              name={item.status === "Present" ? "checkmark-circle" : "close-circle"}
              size={16}
              color={item.status === "Present" ? "#155724" : "#c82333"}
            />
            <Text style={[styles.statusText, item.status === "Present" ? styles.statusTextPresent : styles.statusTextAbsent]}>
              {item.status === "Present" ? "حاضر" : "غائب"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد بيانات حضور اليوم</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  const presentCount = todayData.filter((item) => item.status === "Present").length;
  const absentCount = todayData.filter((item) => item.status === "Absent").length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سجل اليوم</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.statPresent]}>
          <Ionicons name="checkmark-circle" size={24} color="#155724" />
          <Text style={styles.statValue}>{presentCount}</Text>
          <Text style={styles.statLabel}>حاضرون</Text>
        </View>
        <View style={[styles.statBox, styles.statAbsent]}>
          <Ionicons name="close-circle" size={24} color="#c82333" />
          <Text style={styles.statValue}>{absentCount}</Text>
          <Text style={styles.statLabel}>غائبون</Text>
        </View>
        <View style={[styles.statBox, styles.statTotal]}>
          <Ionicons name="people" size={24} color="#007bff" />
          <Text style={styles.statValue}>{todayData.length}</Text>
          <Text style={styles.statLabel}>الإجمالي</Text>
        </View>
      </View>

      {/* Table */}
      {todayData.length > 0 ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={todayData}
            renderItem={renderAttendanceRow}
            keyExtractor={(item) => item.employeeId}
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
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#005fa3",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row-reverse",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statPresent: {
    backgroundColor: "#d4edda",
  },
  statAbsent: {
    backgroundColor: "#f8d7da",
  },
  statTotal: {
    backgroundColor: "#d1ecf1",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
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
  rowPresent: {
    backgroundColor: "#f0f8f5",
  },
  rowAbsent: {
    backgroundColor: "#fff5f5",
  },
  tableCell: {
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  nameColumn: {
    flex: 1.2,
  },
  checkInColumn: {
    flex: 0.9,
    alignItems: "center",
  },
  checkOutColumn: {
    flex: 0.9,
    alignItems: "center",
  },
  statusColumn: {
    flex: 0.8,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  cellText: {
    fontSize: 12,
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row-reverse",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  statusBadgePresent: {
    backgroundColor: "#d4edda",
  },
  statusBadgeAbsent: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextPresent: {
    color: "#155724",
  },
  statusTextAbsent: {
    color: "#c82333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
});

export default TodayLog;
