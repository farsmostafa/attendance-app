import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchPresentCountsByDates, fetchTodaysAttendanceRecords } from "../services/attendanceService";

// ── Design Tokens (shared with AttendanceLogsContent) ─────────────────────────
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
  onViewAllAttendance?: () => void;
}

interface WeeklyAttendanceItem {
  day: string;
  pct: number;
}

const WEEKLY_WORKDAYS = [
  { dayLabel: "السبت" },
  { dayLabel: "الأحد" },
  { dayLabel: "الإثنين" },
  { dayLabel: "الثلاثاء" },
  { dayLabel: "الأربعاء" },
  { dayLabel: "الخميس" },
];

const toIsoLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentWeekWorkdays = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const diffToSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);

  saturday.setHours(0, 0, 0, 0);
  saturday.setDate(today.getDate() - diffToSaturday);

  return WEEKLY_WORKDAYS.map((workday, index) => {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + index);

    return {
      day: workday.dayLabel,
      date: toIsoLocalDate(date),
    };
  });
};

// ── Arabic Date Helper ────────────────────────────────────────────────────────
const getArabicDate = (): string => {
  try {
    return new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const DashboardContent: React.FC<DashboardContentProps> = ({ employees, presentToday = 0, onViewAllAttendance }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<WeeklyAttendanceItem[]>(
    WEEKLY_WORKDAYS.map((workday) => ({ day: workday.dayLabel, pct: 0 })),
  );
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMedium = width >= 600;
  const isMobile = width < 600;
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setAttendanceLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const records = await fetchTodaysAttendanceRecords(today);
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

  useEffect(() => {
    let isCancelled = false;

    const fetchWeeklyAttendanceData = async () => {
      try {
        const workdays = getCurrentWeekWorkdays();
        const countsByDate = await fetchPresentCountsByDates(workdays.map((workday) => workday.date));
        const nextWeeklyData: WeeklyAttendanceItem[] = workdays.map((workday) => {
          const presentCount = countsByDate[workday.date] ?? 0;
          const pct = employees.length > 0 ? Math.round((presentCount / employees.length) * 100) : 0;

          return {
            day: workday.day,
            pct: Math.min(Math.max(pct, 0), 100),
          };
        });

        if (!isCancelled) {
          setWeeklyAttendanceData(nextWeeklyData);
        }
      } catch (error) {
        console.error("Error fetching weekly attendance summary:", error);
        if (!isCancelled) {
          setWeeklyAttendanceData(WEEKLY_WORKDAYS.map((workday) => ({ day: workday.dayLabel, pct: 0 })));
        }
      }
    };

    fetchWeeklyAttendanceData();

    return () => {
      isCancelled = true;
    };
  }, [employees.length]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const totalEmployees = employees.length;
  const absentCount = Math.max(0, totalEmployees - presentToday);
  const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
  const highestWeeklyPct = weeklyAttendanceData.length > 0 ? Math.max(...weeklyAttendanceData.map((d) => d.pct)) : 0;

  // ── Stat Cards Config ──────────────────────────────────────────────────────
  const statCards = [
    {
      label: "إجمالي الموظفين",
      value: totalEmployees,
      icon: "people-outline" as const,
      color: C.textSecondary,
      valueColor: C.textPrimary,
    },
    {
      label: "حاضر اليوم",
      value: presentToday,
      icon: "checkmark-circle-outline" as const,
      color: C.accent,
      valueColor: C.accent,
    },
    {
      label: "غائب",
      value: absentCount,
      icon: "person-remove-outline" as const,
      color: C.textSecondary,
      valueColor: C.textPrimary,
    },
    {
      label: "متأخر",
      value: lateCount,
      icon: "time-outline" as const,
      color: C.error,
      valueColor: C.error,
    },
  ];

  // ── Activity Feed Data (live from records, fallback to hardcoded sample) ──
  const activityData = attendanceRecords.length > 0
    ? attendanceRecords.slice(0, 4).map((r) => ({
        name: r.userName || "—",
        checkIn: formatTime(r.check_in),
        checkOut: formatTime(r.check_out),
        status: r.status,
        statusLabel: r.status === "late" ? "متأخر" : "في الموعد",
      }))
    : [
        { name: "أحمد محمود", checkIn: "08:00 ص", checkOut: "04:05 م", status: "on-time" as const, statusLabel: "في الموعد" },
        { name: "سارة علي", checkIn: "08:15 ص", checkOut: "04:15 م", status: "late" as const, statusLabel: "متأخر" },
        { name: "محمد حسن", checkIn: "08:20 ص", checkOut: "04:25 م", status: "late" as const, statusLabel: "خارج النطاق" },
        { name: "فاطمة نور", checkIn: "08:05 ص", checkOut: "04:50 م", status: "on-time" as const, statusLabel: "في الموعد" },
      ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

      {/* ═══════════════════════ PAGE HEADER ═══════════════════════ */}
      <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
        <Text style={styles.pageTitle}>لوحة القيادة</Text>
        <Text style={styles.pageSubtitle}>{getArabicDate()}</Text>
      </View>
      <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
        {statCards.map((card, idx) => (
          <View
            key={idx}
            style={[
              styles.statCard,
              isWide
                ? { flexBasis: "23%" }
                : isMedium
                ? { flexBasis: "47%" }
                : { flexBasis: "100%" },
            ]}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Ionicons name={card.icon} size={22} color={card.color} />
            </View>
            <Text style={[styles.statValue, { color: card.valueColor }]}>{card.value}</Text>
          </View>
        ))}
      </View>

      {/* ═══════════════════════ BOTTOM GRID ═══════════════════════ */}
      <View style={[styles.bottomGrid, isWide && styles.bottomGridWide]}>

        {/* ── Activity Feed (2/3) ── */}
        <View style={[styles.activityCard, isWide && { flex: 2 }]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>النشاط المباشر</Text>
            <Pressable style={styles.viewAllBtn} onPress={onViewAllAttendance}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
            </Pressable>
          </View>

          {/* Table Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thCell, { flex: 1.5 }]}>الموظف</Text>
            <Text style={[styles.thCell, { flex: 1 }]}>الحضور</Text>
            <Text style={[styles.thCell, { flex: 1 }]}>الانصراف</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>الحالة</Text>
          </View>

          {/* Loading / Error / Empty / Data */}
          {attendanceLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : attendanceError ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={28} color={C.error} />
              <Text style={[styles.emptyText, { color: C.error }]}>{attendanceError}</Text>
            </View>
          ) : (
            activityData.map((row, idx) => {
              const isLate = row.status === "late";
              const badgeColor = isLate ? C.error : C.accent;
              const badgeBg = isLate ? C.errorDim : C.accentDim;
              const badgeBorder = isLate ? C.errorBorder : C.accentBorder;

              return (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx < activityData.length - 1 && styles.tableRowBorder,
                  ]}
                >
                  <Text style={[styles.cellText, styles.cellPrimary, { flex: 1.5 }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={[styles.cellText, styles.cellSecondary, { flex: 1 }]} numberOfLines={1}>
                    {row.checkIn}
                  </Text>
                  <Text style={[styles.cellText, styles.cellSecondary, { flex: 1 }]} numberOfLines={1}>
                    {row.checkOut}
                  </Text>
                  <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                    <View style={[styles.badge, { borderColor: badgeBorder, backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{row.statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Weekly Summary Chart (1/3) ── */}
        <View style={[styles.weeklyCard, isWide && { flex: 1 }]}>
          <Text style={styles.cardTitle}>ملخص الحضور الأسبوعي</Text>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            {/* Grid Lines */}
            <View style={styles.gridLines}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            {/* Bars */}
            <View style={styles.barsRow}>
              {weeklyAttendanceData.map((item, idx) => {
                const isHighest = highestWeeklyPct > 0 && item.pct === highestWeeklyPct;
                return (
                  <View key={idx} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${item.pct}%`,
                            backgroundColor: isHighest ? C.accent : "rgba(255,235,167,0.20)",
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        isHighest && { color: C.accent },
                      ]}
                    >
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  contentContainer: {
    padding: 24,
    gap: 24,
    paddingBottom: 48,
  },

  /* ── Page Header ── */
  pageHeader: {
    marginBottom: 28,
  },
  pageHeaderMobile: {
    paddingRight: 56,
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

  /* ── Stats Grid ── */
  statsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 16,
  },
  statsGridWide: {
    flexWrap: "nowrap",
  },
  statCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    borderRadius: 8,
    gap: 12,
    flexGrow: 1,
  },
  statCardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statLabel: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "right",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "right",
    letterSpacing: -1,
  },

  /* ── Bottom Grid (Activity + Weekly) ── */
  bottomGrid: {
    gap: 24,
  },
  bottomGridWide: {
    flexDirection: "row-reverse",
    gap: 24,
  },

  /* ── Activity Feed Card ── */
  activityCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "rgba(31,32,41,0.5)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: C.textPrimary,
    textAlign: "right",
  },
  viewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  viewAllText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "600",
  },

  /* ── Table (Flexbox) ── */
  tableHeader: {
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  thCell: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cellText: {
    fontSize: 13,
    textAlign: "right",
  },
  cellPrimary: {
    color: C.textPrimary,
    fontWeight: "500",
  },
  cellSecondary: {
    color: C.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  /* ── Loading / Empty States ── */
  loadingBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    color: C.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  emptyText: {
    color: C.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },

  /* ── Weekly Chart Card ── */
  weeklyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 20,
    gap: 20,
  },
  chartContainer: {
    flex: 1,
    minHeight: 200,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingTop: 20,
  },
  gridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "rgba(255,235,167,0.06)",
  },
  barsRow: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 0,
  },
  barColumn: {
    flex: 1,
    alignItems: "stretch",
    gap: 8,
  },
  barTrack: {
    width: "100%",
    height: 160,
    justifyContent: "flex-end",
    backgroundColor: C.bg,
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
  },
  barLabel: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
    writingDirection: "rtl",
    alignSelf: "stretch",
    paddingBottom: 8,
  },
});

export default DashboardContent;
