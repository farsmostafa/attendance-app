import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackNavigationProp } from "../types";
import { fetchTodaysAttendanceRecords } from "../services/attendanceService";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  check_in: any;
  check_out?: any;
  isLate: boolean;
  status: "on-time" | "late";
  location: any;
  workDuration?: number;
}

const TodayLogContent: React.FC<Props> = ({ companyId }) => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const records = await fetchTodaysAttendanceRecords(selectedDate);
        setAttendanceRecords(records);
      } catch (err) {
        console.error("Error fetching attendance records:", err);
        setError("فشل تحميل السجلات");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [selectedDate]);

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

  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    const today = new Date(new Date().toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);

    // Prevent selecting future dates
    if (currentDate <= today) {
      setSelectedDate(currentDate.toISOString().split("T")[0]);
    }
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  const isToday = selectedDate === today;
  const canGoForward = new Date(selectedDate) < new Date(today);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>سجل اليوم</Text>

        {/* Date Picker Section */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity style={styles.dateNavButton} onPress={handlePreviousDay}>
            <Ionicons name="chevron-back" size={20} color="#007bff" />
          </TouchableOpacity>

          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              editable={true}
            />
            {isToday && <Text style={styles.todayBadge}>اليوم</Text>}
          </View>

          <TouchableOpacity
            style={[styles.dateNavButton, !canGoForward && styles.dateNavButtonDisabled]}
            onPress={handleNextDay}
            disabled={!canGoForward}
          >
            <Ionicons name="chevron-forward" size={20} color={canGoForward ? "#007bff" : "#ccc"} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
          <Text style={styles.todayButtonText}>العودة لليوم</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري تحميل سجلات اليوم...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : attendanceRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={32} color="#999" />
          <Text style={styles.emptyText}>لا توجد سجلات حضور لهذا اليوم</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell, styles.cellName]}>اسم الموظف</Text>
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
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
    flex: 2.5,
    marginHorizontal: 4,
  },
  cellTime: {
    flex: 1.2,
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
  datePickerContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateNavButtonDisabled: {
    opacity: 0.5,
  },
  dateInputWrapper: {
    flex: 1,
    position: "relative",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  todayBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007bff",
  },
});

export default TodayLogContent;
