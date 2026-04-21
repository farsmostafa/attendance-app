import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { RootStackParamList } from "./types";

type AttendanceHistoryProps = NativeStackScreenProps<RootStackParamList, "AttendanceHistory"> & { isFocused?: boolean };

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: any;
  checkOut?: any;
  workDuration?: number;
  isLate?: boolean;
  status?: "on-time" | "late";
}

const MONTH_OPTIONS = [
  { value: "01", label: "يناير" },
  { value: "02", label: "فبراير" },
  { value: "03", label: "مارس" },
  { value: "04", label: "أبريل" },
  { value: "05", label: "مايو" },
  { value: "06", label: "يونيو" },
  { value: "07", label: "يوليو" },
  { value: "08", label: "أغسطس" },
  { value: "09", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" },
  { value: "12", label: "ديسمبر" },
];

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => String(currentYear - index));
};

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ isFocused = true }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const yearOptions = buildYearOptions();

  const formatTimeValue = (value?: any) => {
    try {
      if (!value) return "--";
      const dateValue = typeof value.toDate === "function" ? value.toDate() : value instanceof Date ? value : null;
      if (!dateValue) return "--";
      return dateValue.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "--";
    }
  };

  const formatDateValue = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDuration = (minutes?: number) => {
    if (typeof minutes !== "number" || Number.isNaN(minutes)) return "--";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toLocaleString("en-US")}h ${remainingMinutes.toLocaleString("en-US")}m`;
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          setRecords([]);
          return;
        }

        const monthStart = `${selectedYear}-${selectedMonth}-01`;
        const monthEnd = `${selectedYear}-${selectedMonth}-31`;

        const attendanceQuery = query(
          collection(db, "attendance"),
          where("userId", "==", currentUserId),
          where("date", ">=", monthStart),
          where("date", "<=", monthEnd),
          orderBy("date", "desc"),
        );

        const snapshot = await getDocs(attendanceQuery);
        const nextRecords: AttendanceRecord[] = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            date: data.date,
            checkIn: data.check_in,
            checkOut: data.check_out,
            workDuration: data.workDuration,
            isLate: data.isLate,
            status: data.status,
          };
        });

        setRecords(nextRecords);
      } catch (error) {
        console.error("Failed to fetch attendance history:", error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchAttendance();
    }
  }, [isFocused, selectedMonth, selectedYear]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.headerWrap}>
          <Text style={styles.brandName}>دوّمت</Text>
          <Text style={styles.title}>سجلي الشخصي</Text>
          <Text style={styles.subtitle}>سجل حضورك وانصرافك بحسب الشهر والسنة</Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>تصفية السجلات</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>الشهر</Text>
              {Platform.OS === "web" ? (
                <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} style={webSelectStyle}>
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Text style={styles.filterFallback}>{MONTH_OPTIONS.find((month) => month.value === selectedMonth)?.label}</Text>
              )}
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>السنة</Text>
              {Platform.OS === "web" ? (
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} style={webSelectStyle}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              ) : (
                <Text style={styles.filterFallback}>{selectedYear}</Text>
              )}
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#ffeba7" />
            <Text style={styles.loadingText}>جاري تحميل السجلات...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={48} color="#7b8194" />
            <Text style={styles.emptyTitle}>لا توجد سجلات حضور في هذا الشهر</Text>
          </View>
        ) : (
          <View style={styles.recordsWrap}>
            {records.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{formatDateValue(record.date)}</Text>
                  <View style={[styles.statusPill, record.isLate ? styles.statusPillLate : styles.statusPillOnTime]}>
                    <Text style={styles.statusPillText}>{record.isLate ? "متأخر" : "في الموعد"}</Text>
                  </View>
                </View>

                <View style={styles.recordRow}>
                  <Text style={styles.recordValue}>{formatTimeValue(record.checkIn)}</Text>
                  <Text style={styles.recordLabel}>الحضور</Text>
                </View>

                <View style={styles.recordRow}>
                  <Text style={styles.recordValue}>{formatTimeValue(record.checkOut)}</Text>
                  <Text style={styles.recordLabel}>الانصراف</Text>
                </View>

                <View style={styles.recordRow}>
                  <Text style={styles.recordValue}>{formatDuration(record.workDuration)}</Text>
                  <Text style={styles.recordLabel}>ساعات العمل</Text>
                </View>

                <View style={styles.recordRowLast}>
                  <Text style={styles.recordValue}>{record.status === "late" ? "Late" : "On Time"}</Text>
                  <Text style={styles.recordLabel}>الحالة</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const webSelectStyle = {
  width: "100%",
  height: 44,
  borderRadius: 10,
  border: "1px solid #e8d87a",
  backgroundColor: "#fff9dc",
  color: "#102770",
  padding: "0 12px",
  fontSize: 14,
  fontWeight: 700,
  textAlign: "right" as const,
  outline: "none",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a2b38",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  headerWrap: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2a2b38",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2a2b38",
    marginTop: 2,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 13,
    color: "#6f7384",
    marginTop: 4,
    textAlign: "right",
  },
  filterCard: {
    backgroundColor: "#ffeba7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  filterTitle: {
    textAlign: "right",
    fontSize: 15,
    fontWeight: "900",
    color: "#102770",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: "#102770",
    marginBottom: 8,
  },
  filterFallback: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fff9dc",
    color: "#102770",
    textAlign: "right",
    textAlignVertical: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  loadingWrap: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#49516c",
    textAlign: "center",
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#7b8194",
    textAlign: "center",
  },
  recordsWrap: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eceffd",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recordHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2a2b38",
    textAlign: "right",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillLate: {
    backgroundColor: "#dc2626",
  },
  statusPillOnTime: {
    backgroundColor: "#16a34a",
  },
  statusPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  recordRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e3e7f5",
  },
  recordRowLast: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  recordLabel: {
    color: "#7f8598",
    fontSize: 14,
    fontWeight: "700",
  },
  recordValue: {
    color: "#2a2b38",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
});

export default AttendanceHistory;
