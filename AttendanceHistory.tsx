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
  const isMobile = width < 1024; // Match the breakpoint in EmployeeLayout

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
      month: parsed.toLocaleDateString("ar-EG", { month: "short" }),
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
  const totalMinutes = records.reduce((sum, r) => sum + Math.max(0, r.workDuration || 0), 0);
  const totalHoursNum = Math.floor(totalMinutes / 60);
  const totalMinsNum = totalMinutes % 60;
  const totalHours = `${String(totalHoursNum).padStart(2, '0')}:${String(totalMinsNum).padStart(2, '0')}`;
  const daysPresent = records.length;
  // Simple absent calculation based on weekdays up to today (if current month) or total weekdays
  const daysAbsent = 0; // Using 0 as a placeholder per logic lock

  // ── Bulletproof duration formatter ──
  const formatDurationHHMM = (checkIn: any, checkOut: any, duration?: number): string => {
    const toHHMM = (d: number): string => {
      if (d < 0 || Number.isNaN(d)) return '--:--';
      const h = Math.floor(d / 60);
      const m = d % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    if (typeof duration === 'number' && duration >= 0) {
      return toHHMM(duration);
    }
    if (!checkIn || !checkOut) return '--:--';
    const parseTimeToMinutes = (timeVal: any): number | null => {
      if (timeVal?.toDate) {
        const d = timeVal.toDate();
        return d.getHours() * 60 + d.getMinutes();
      }
      if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
        return timeVal.getHours() * 60 + timeVal.getMinutes();
      }
      if (typeof timeVal === 'string') {
        const str = timeVal.trim();
        const match = str.match(/(\d+):(\d+)/);
        if (!match) return null;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const isPM = str.toLowerCase().includes('pm') || str.includes('م');
        const isAM = str.toLowerCase().includes('am') || str.includes('ص');
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60 + minutes;
      }
      return null;
    };
    const inMins = parseTimeToMinutes(checkIn);
    const outMins = parseTimeToMinutes(checkOut);
    if (inMins !== null && outMins !== null) {
      let diff = outMins - inMins;
      if (diff < 0) diff += 24 * 60;
      return toHHMM(diff);
    }
    return '--:--';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.mainContent}>
        
        {/* ── Header Row ── */}
        <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
          <Text style={[styles.pageTitle,{paddingRight: 20} , isMobile && styles.pageTitleMobile]}>سجل الحضور</Text>
          <View style={[styles.filtersWrap, isMobile && styles.filtersWrapMobile]}>
            {/* Year Dropdown */}
            <View style={[styles.filterField, isMobile && styles.filterFieldMobile]}>
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
            <View style={[styles.filterField, isMobile && styles.filterFieldMobile]}>
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
              <Text style={styles.summaryUnit}>س:د</Text>
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
              const durationFormatted = formatDurationHHMM(record.checkIn, record.checkOut, record.workDuration);

              return (
                <View key={record.id} style={styles.recordCard}>
                  {/* Top Row: Date & Status */}
                  <View style={styles.recordTopRow}>
                    <View style={styles.dateAndDayWrap}>
                      <View style={styles.recordDateBox}>
                        <Text style={styles.dateBoxDay}>{day}</Text>
                        <Text style={styles.dateBoxMonth}>{month}</Text>
                      </View>
                      <View style={styles.dayNameBox}>
                        <Text style={styles.dayNameText}>{weekday}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.recordCellLeft}>
                      <View style={[styles.statusPill, record.isLate && styles.statusPillLate]}>
                        <Text style={[styles.statusPillText, record.isLate && styles.statusPillTextLate]}>
                          {record.isLate ? "متأخر" : "مكتمل"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Row: Details */}
                  <View style={styles.recordBottomRow}>
                    <View style={styles.recordCellCenter}>
                      <Text style={styles.cellLabel}>الدخول</Text>
                      <Text style={styles.cellValue}>{formatTimeValue(record.checkIn)}</Text>
                    </View>

                    <View style={styles.recordCellCenter}>
                      <Text style={styles.cellLabel}>الخروج</Text>
                      <Text style={styles.cellValue}>{formatTimeValue(record.checkOut)}</Text>
                    </View>

                    <View style={styles.recordCellCenter}>
                      <Text style={styles.cellLabel}>إجمالي الساعات</Text>
                      <View style={styles.cellValueWrap}>
                        <Text style={styles.cellValue}>{durationFormatted}</Text>
                      </View>
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
    flexWrap: "wrap",
  },
  headerRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: Spacing.xl,
  },
  pageTitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xl,
    fontWeight: "800",
    color: Colors.accent,
  },
  pageTitleMobile: {
    alignSelf: "flex-end", // Align to right
    marginRight: 60, // Space for the mobile toggle button
  },
  filtersWrap: {
    flexDirection: "row-reverse", // RTL
    gap: Spacing.sm,
  },
  filtersWrapMobile: {
    width: "100%",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  filterField: {
    width: 100,
  },
  filterFieldMobile: {
    flex: 1,
    width: "auto",
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
    gap: Spacing.base,
  },
  recordCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "column",
  },
  recordTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateAndDayWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  recordDateBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
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
  dayNameBox: {
    minWidth: 50,
    alignItems: "flex-end", // RTL align
  },
  dayNameText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    fontWeight: "700",
    textAlign: "right",
  },
  recordBottomRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: Spacing.base,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
  },
  recordCellCenter: {
    alignItems: "center",
    flex: 1,
  },
  cellLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  cellValueWrap: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    gap: 2,
  },
  cellValue: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
  cellUnitText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
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

