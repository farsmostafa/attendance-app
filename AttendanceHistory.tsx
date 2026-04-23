import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { RootStackParamList } from "./types";

// ── Design System Tokens (Section 3) ──
const Colors = {
  background: "#1f2029",
  surface: "#2a2b38",
  surfaceElevated: "#32333f",
  border: "rgba(62, 63, 75, 0.5)",
  accent: "#ffeba7",
  accentText: "#101116",
  textPrimary: "#e7e2da",
  textSecondary: "#969081",
  success: "#abcfb2",
  error: "#ffb4ab",
  warning: "#ffd27a",
};
const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };
const Radius = { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 };
const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 28,
  fontArabic: "Cairo" as const,
  fontLatin: "Manrope" as const,
  fontMono: "SpaceMono" as const,
};

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const yearOptions = buildYearOptions();

  const formatTimeValue = (value?: any) => {
    try {
      if (!value) return "--:--";
      const dateValue = typeof value.toDate === "function" ? value.toDate() : value instanceof Date ? value : null;
      if (!dateValue) return "--:--";
      return dateValue.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).replace("AM", "ص").replace("PM", "م");
    } catch {
      return "--:--";
    }
  };

  const getDayAndMonth = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return { day: "--", month: "--", weekday: "--" };
    return {
      day: parsed.toLocaleDateString("en-US", { day: "2-digit" }),
      month: parsed.toLocaleDateString("ar-EG", { month: "long" }),
      weekday: parsed.toLocaleDateString("ar-EG", { weekday: "long" }),
    };
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

  // Derived calculations for Summary Cards
  const totalMinutes = records.reduce((sum, r) => sum + (r.workDuration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const daysPresent = records.length;
  // Simple absent calculation based on weekdays up to today (if current month) or total weekdays
  const daysAbsent = 0; // Using 0 as a placeholder per logic lock

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.mainContent}>
        
        {/* ── Header Row ── */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>سجل الحضور</Text>
          <View style={styles.filtersWrap}>
            {/* Year Dropdown */}
            <View style={styles.filterField}>
              {Platform.OS === "web" ? (
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} style={webSelectStyle}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : (
                <Text style={styles.filterFallback}>{selectedYear}</Text>
              )}
            </View>
            {/* Month Dropdown */}
            <View style={styles.filterField}>
              {Platform.OS === "web" ? (
                <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} style={webSelectStyle}>
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              ) : (
                <Text style={styles.filterFallback}>{MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Summary Cards (Responsive) ── */}
        <View style={styles.summaryWrap}>
          {/* Total Hours */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>إجمالي الساعات</Text>
            <View style={styles.summaryValueWrap}>
              <Text style={styles.summaryValue}>{totalHours}</Text>
              <Text style={styles.summaryUnit}>ساعة</Text>
            </View>
          </View>
          {/* Days Absent */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>عدد أيام الغياب</Text>
            <View style={styles.summaryValueWrap}>
              <Text style={styles.summaryValue}>{daysAbsent}</Text>
              <Text style={styles.summaryUnit}>أيام</Text>
            </View>
          </View>
          {/* Days Present */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>عدد أيام الحضور</Text>
            <View style={styles.summaryValueWrap}>
              <Text style={styles.summaryValue}>{daysPresent}</Text>
              <Text style={styles.summaryUnit}>يوم</Text>
            </View>
          </View>
        </View>

        {/* ── Content Area ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>جاري تحميل السجلات...</Text>
          </View>
        ) : records.length === 0 ? (
          // ── Empty State ──
          <View style={styles.emptyStateCard}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>لا توجد سجلات حضور لهذا الشهر</Text>
            <Text style={styles.emptySubtitle}>
              سيظهر جدول حضورك وانصرافك هنا بمجرد توفر البيانات لهذا التاريخ المختار.
            </Text>
          </View>
        ) : (
          // ── Populated State ──
          <View style={styles.recordsList}>
            {records.map((record) => {
              const { day, month, weekday } = getDayAndMonth(record.date);
              let durationFormatted = "--:--";
              if (record.workDuration !== undefined && record.workDuration !== null) {
                const hours = Math.floor(record.workDuration / 60);
                const minutes = Math.floor(record.workDuration % 60);
                durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }

              return (
                <View key={record.id} style={styles.recordRow}>
                  {/* 1. Date Box (Rightmost) */}
                  <View style={styles.recordDateBox}>
                    <Text style={styles.dateBoxDay}>{day}</Text>
                    <Text style={styles.dateBoxMonth}>{month}</Text>
                  </View>

                  {/* 2. Day Name */}
                  <View style={styles.dayNameBox}>
                    <Text style={styles.dayNameText}>{weekday}</Text>
                  </View>

                  {/* 3. Check In Column */}
                  <View style={styles.recordCellCenter}>
                    <Text style={styles.cellLabel}>الدخول</Text>
                    <Text style={styles.cellValue}>{formatTimeValue(record.checkIn)}</Text>
                  </View>

                  {/* 4. Check Out Column */}
                  <View style={styles.recordCellCenter}>
                    <Text style={styles.cellLabel}>الخروج</Text>
                    <Text style={styles.cellValue}>{formatTimeValue(record.checkOut)}</Text>
                  </View>

                  {/* 5. Total Hours Column */}
                  <View style={styles.recordCellCenter}>
                    <Text style={styles.cellLabel}>إجمالي الساعات</Text>
                    <Text style={styles.cellValue}>{durationFormatted}</Text>
                  </View>

                  {/* 6. Status Pill (Leftmost) */}
                  <View style={styles.recordCellLeft}>
                    <View style={[styles.statusPill, record.isLate && styles.statusPillLate]}>
                      <Text style={[styles.statusPillText, record.isLate && styles.statusPillTextLate]}>
                        {record.isLate ? "متأخر" : "مكتمل"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const webSelectStyle = {
  width: "100%",
  height: 40,
  borderRadius: Radius.md,
  border: `1px solid ${Colors.border}`,
  backgroundColor: Colors.surface,
  color: Colors.textPrimary,
  padding: "0 12px",
  fontSize: Typography.sm,
  fontWeight: 600,
  fontFamily: "Cairo",
  textAlign: "right" as const,
  outline: "none",
  appearance: "none" as const,
  cursor: "pointer",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
  },
  mainContent: {
    width: "100%",
    maxWidth: 1000, // Constrain width on large desktops
    gap: Spacing.xl,
  },
  
  // ── Header Row ──
  headerRow: {
    flexDirection: "row-reverse", // RTL
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.base,
    width: "100%",
  },
  pageTitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xl,
    fontWeight: "800",
    color: Colors.accent,
  },
  filtersWrap: {
    flexDirection: "row-reverse", // RTL
    gap: Spacing.sm,
  },
  filterField: {
    width: 100,
  },
  filterFallback: {
    fontFamily: Typography.fontArabic,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    textAlign: "right",
    textAlignVertical: "center",
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sm,
    fontWeight: "600",
  },

  // ── Summary Cards ──
  summaryWrap: {
    flexDirection: "row-reverse", // RTL
    flexWrap: "wrap",
    gap: Spacing.base,
  },
  summaryCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "flex-end", // RTL text alignment
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontFamily: Typography.fontArabic,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
  summaryValueWrap: {
    flexDirection: "row-reverse", // RTL
    alignItems: "baseline",
    justifyContent: "flex-end", // Align right
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  summaryValue: {
    fontFamily: Typography.fontArabic,
    color: Colors.accent,
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  summaryUnit: {
    fontFamily: Typography.fontArabic,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "500",
  },

  // ── Empty State ──
  emptyStateCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 22,
  },

  // ── Loading State ──
  loadingWrap: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: Typography.fontArabic,
    color: Colors.textSecondary,
    marginTop: Spacing.base,
    fontSize: Typography.base,
  },

  // ── Populated Records List ──
  recordsList: {
    gap: Spacing.sm,
  },
  recordRow: {
    flexDirection: "row-reverse", // RTL
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  recordDateBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNameBox: {
    minWidth: 50,
    alignItems: "center",
    marginHorizontal: Spacing.sm,
  },
  dayNameText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  dateBoxDay: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xl,
    fontWeight: "800",
    color: Colors.accent,
    lineHeight: 28,
  },
  dateBoxMonth: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  recordCellCenter: {
    flex: 1,
    alignItems: "center",
  },
  cellLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  cellValueWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.xs,
  },
  cellValue: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  cellWeekday: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  recordCellLeft: {
    alignItems: "flex-start",
  },
  statusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusPillLate: {
    borderColor: Colors.error,
  },
  statusPillText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statusPillTextLate: {
    color: Colors.error,
  },
});

export default AttendanceHistory;
