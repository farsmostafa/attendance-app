import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { RootStackParamList } from "./types";

type AttendanceHistoryProps = NativeStackScreenProps<RootStackParamList, "AttendanceHistory"> & { isFocused?: boolean };

interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  type: string;
  timestamp: Date;
}

interface MonthlyGroup {
  monthYear: string;
  month: number;
  year: number;
  records: AttendanceRecord[];
  totalDaysPresent: number;
  absences: number;
  permissions: number;
  bonus: number;
}

/**
 * Employee Personal Attendance Records - سجلي الشخصي
 * CRITICAL: Only shows records where userId == currentUser.uid
 * Employees NEVER see other employees' records
 */
const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ navigation, isFocused = true }) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        const userData = await getCurrentUserData();
        if (!userData || !userData.uid) {
          setLoading(false);
          return;
        }

        // Query all attendance records for current user, ordered by timestamp (descending)
        const q = query(collection(db, "attendance"), where("userId", "==", userData.uid), orderBy("timestamp", "desc"));

        const querySnapshot = await getDocs(q);

        // Transform documents into display format
        const records: AttendanceRecord[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);

          // Format date as DD/MM/YYYY
          const date = timestamp.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          // Format time as HH:MM
          const time = timestamp.toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
            second: undefined,
          });

          return {
            id: doc.id,
            date,
            time,
            type: data.type,
            timestamp,
          };
        });

        // Group records by month and year
        const groupedByMonth = new Map<string, AttendanceRecord[]>();

        records.forEach((record) => {
          const monthYear = record.timestamp.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
          });

          if (!groupedByMonth.has(monthYear)) {
            groupedByMonth.set(monthYear, []);
          }
          groupedByMonth.get(monthYear)!.push(record);
        });

        // Convert map to array with stats
        const monthlyGroups: MonthlyGroup[] = Array.from(groupedByMonth.entries()).map(([monthYear, groupRecords]) => {
          // Calculate unique days with check-in
          const uniqueDaysWithCheckIn = new Set(groupRecords.filter((r) => r.type === "check-in").map((r) => r.date)).size;

          const timestamp = groupRecords[0].timestamp;

          return {
            monthYear,
            month: timestamp.getMonth(),
            year: timestamp.getFullYear(),
            records: groupRecords,
            totalDaysPresent: uniqueDaysWithCheckIn,
            absences: 0, // Placeholder
            permissions: 0, // Placeholder
            bonus: 0, // Placeholder (0 EGP)
          };
        });

        setMonthlyData(monthlyGroups);
      } catch (err) {
        console.error("Error fetching attendance history:", err);
        Alert.alert("خطأ", "فشل في جلب السجل. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, []);

  const renderMonthlyStats = (monthData: MonthlyGroup) => (
    <View key={`${monthData.month}-${monthData.year}`} style={styles.monthContainer}>
      {/* Month Header */}
      <Text style={styles.monthHeader}>{monthData.monthYear}</Text>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{monthData.totalDaysPresent}</Text>
            <Text style={styles.statLabel}>أيام الحضور</Text>
          </View>

          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{monthData.absences}</Text>
            <Text style={styles.statLabel}>الغيابات</Text>
          </View>

          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{monthData.permissions}</Text>
            <Text style={styles.statLabel}>الإجازات</Text>
          </View>

          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{monthData.bonus}</Text>
            <Text style={styles.statLabel}>الحوافز</Text>
          </View>
        </View>
      </View>

      {/* Daily Logs */}
      <View style={styles.dailyLogsContainer}>
        {monthData.records.map((record) => (
          <View key={record.id} style={styles.dailyLogRow}>
            <View style={styles.logDateColumn}>
              <Text style={styles.logDate}>{record.date}</Text>
            </View>

            <View style={styles.logTypeColumn}>
              <View style={[styles.typeBadge, record.type === "check-in" ? styles.typeBadgeCheckIn : styles.typeBadgeCheckOut]}>
                <Text style={[styles.typeLabel, record.type === "check-in" ? styles.typeLabelCheckIn : styles.typeLabelCheckOut]}>
                  {record.type === "check-in" ? "حضور" : "انصراف"}
                </Text>
              </View>
            </View>

            <View style={styles.logTimeColumn}>
              <Text style={styles.logTime}>{record.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Month Divider */}
      <View style={styles.monthDivider} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>جاري تحميل السجل...</Text>
      </View>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>لا توجد سجلات حضور بعد.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>سجل الحضور والانصراف</Text>
        <Text style={styles.subtitle}>تقرير شامل للحضور والانصراف</Text>
      </View>

      {monthlyData.map((monthData) => renderMonthlyStats(monthData))}

      <View style={styles.footerSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerContainer: {
    paddingVertical: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  monthContainer: {
    marginBottom: 15,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  dailyLogsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dailyLogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logDateColumn: {
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  logTypeColumn: {
    flex: 1,
    alignItems: "center",
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeCheckIn: {
    backgroundColor: "#d4edda",
  },
  typeBadgeCheckOut: {
    backgroundColor: "#fff3cd",
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  typeLabelCheckIn: {
    color: "#155724",
  },
  typeLabelCheckOut: {
    color: "#856404",
  },
  logTimeColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  logTime: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  monthDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 50,
  },
  footerSpacer: {
    height: 30,
  },
});

export default AttendanceHistory;
