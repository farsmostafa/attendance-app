import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackNavigationProp } from "../types";
import { fetchAllAttendanceRecords } from "../services/attendanceService";

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

const AttendanceLogsContent: React.FC<Props> = ({ companyId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const logsDateSubtitle = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllAttendanceRecords();
        setRecords(data);
      } catch (err) {
        console.error("Error fetching attendance records:", err);
        setError("فشل تحميل السجلات");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateString;
    }
  };

  const formatDurationHHMM = (checkIn: any, checkOut: any, duration?: number): string => {
    const toHHMM = (d: number): string => {
      if (d < 0 || Number.isNaN(d)) return "--:--";
      const h = Math.floor(d / 60);
      const m = d % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    if (typeof duration === "number" && duration >= 0) return toHHMM(duration);
    if (!checkIn || !checkOut) return "--:--";
    const parseTimeToMinutes = (timeVal: any): number | null => {
      if (timeVal?.toDate) {
        const dt = timeVal.toDate();
        return dt.getHours() * 60 + dt.getMinutes();
      }
      if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
        return timeVal.getHours() * 60 + timeVal.getMinutes();
      }
      if (typeof timeVal === "string") {
        const str = timeVal.trim();
        const match = str.match(/(\d+):(\d+)/);
        if (!match) return null;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const isPM = str.toLowerCase().includes("pm") || str.includes("م");
        const isAM = str.toLowerCase().includes("am") || str.includes("ص");
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
    return "--:--";
  };

  const filteredRecords = records.filter((r) => {
    if (searchQuery && !r.userName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });

  return (
    <View className="flex-1 bg-[#1f2029] relative">
      <ScrollView
        className="flex-1 bg-[#1f2029]"
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        {showStatusDropdown && <Pressable className="absolute inset-0 z-40" onPress={() => setShowStatusDropdown(false)} />}
        <View style={[styles.header, !isWide && { paddingRight: 64, justifyContent: "center" }]}>
          <Text className="text-[32px] font-bold text-[#ffeba7] text-right mb-1">سجل الحضور</Text>
          <Text className="text-[#969081] text-right mt-1">{logsDateSubtitle}</Text>
        </View>

        {/* ── Filter Bar ── */}
        <View className="relative z-50" style={[styles.filterBar, { elevation: 10 }]}>
          <View style={styles.filterRow}>
            <View style={[styles.filterGroup, { flexBasis: isWide ? "22%" : width >= 600 ? "46%" : "100%" }]}>
              <Text style={styles.filterLabel}>بحث بالموظف</Text>
              <TextInput
                style={styles.input}
                className="hover:bg-[#2c2a25] active:bg-[#2c2a25] hover:border-[#ffeba7]/30 transition-colors"
                placeholder="اسم الموظف..."
                placeholderTextColor={C.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={[styles.filterGroup, { flexBasis: isWide ? "22%" : width >= 600 ? "46%" : "100%" }]}>
              <Text style={styles.filterLabel}>من تاريخ</Text>
              <TextInput
                style={styles.input}
                className="hover:bg-[#2c2a25] active:bg-[#2c2a25] hover:border-[#ffeba7]/30 transition-colors"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.textSecondary}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={[styles.filterGroup, { flexBasis: isWide ? "22%" : width >= 600 ? "46%" : "100%" }]}>
              <Text style={styles.filterLabel}>إلى تاريخ</Text>
              <TextInput
                style={styles.input}
                className="hover:bg-[#2c2a25] active:bg-[#2c2a25] hover:border-[#ffeba7]/30 transition-colors"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.textSecondary}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
            <View style={[styles.filterGroup, { flexBasis: isWide ? "22%" : width >= 600 ? "46%" : "100%", zIndex: 50 }]}>
              <Text style={styles.filterLabel}>الحالة</Text>
              <View className="relative z-50 flex-1">
                <Pressable
                  className="w-full bg-[#1f2029] border border-[#3e3f4b] rounded-[12px] py-2.5 px-4 flex-row-reverse justify-between items-center hover:bg-[#2c2a25] active:bg-[#2c2a25] transition-colors"
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <Text style={{ color: C.textPrimary, textAlign: "right" }}>
                    {statusFilter === "all" ? "الكل" : statusFilter === "on-time" ? "في الموعد" : "متأخر"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={C.textSecondary} style={styles.dropdownIcon} />
                </Pressable>
                {showStatusDropdown && (
                  <View
                    className="absolute top-[100%] mt-1 left-0 w-full bg-[#2a2b38] border border-[#ffeba7]/20 rounded-[12px] z-50 overflow-hidden shadow-xl"
                    style={{ elevation: 15 }}
                  >
                    <Pressable
                      className="w-full px-4 py-3 hover:bg-[#37352f] active:bg-[#37352f] border-b border-[#ffeba7]/10 transition-colors flex-row-reverse items-center"
                      onPress={() => {
                        setStatusFilter("all");
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text className={`text-right ${statusFilter === "all" ? "text-[#ffeba7]" : "text-[#e7e2da]"}`}>الكل</Text>
                    </Pressable>
                    <Pressable
                      className="w-full px-4 py-3 hover:bg-[#37352f] active:bg-[#37352f] border-b border-[#ffeba7]/10 transition-colors flex-row-reverse items-center"
                      onPress={() => {
                        setStatusFilter("on-time");
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text className={`text-right ${statusFilter === "on-time" ? "text-[#ffeba7]" : "text-[#e7e2da]"}`}>في الموعد</Text>
                    </Pressable>
                    <Pressable
                      className="w-full px-4 py-3 hover:bg-[#37352f] active:bg-[#37352f] border-b border-[#ffeba7]/10 transition-colors flex-row-reverse items-center"
                      onPress={() => {
                        setStatusFilter("late");
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text className={`text-right ${statusFilter === "late" ? "text-[#ffeba7]" : "text-[#e7e2da]"}`}>متأخر</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Logs Table ── */}
        <View className="bg-[#2a2b38] p-4 rounded-[12px] border border-[#ffeba7]/10" style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>سجلات الحضور والانصراف</Text>
          </View>
          <View className="hidden md:flex" style={styles.tableHeader}>
            <Text className="w-[20%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">الموظف</Text>
            <Text className="w-[15%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">التاريخ</Text>
            <Text className="w-[15%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">الحضور</Text>
            <Text className="w-[15%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">الانصراف</Text>
            <Text className="w-[15%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">الحالة</Text>
            <Text className="w-[20%] text-right text-[#969081] text-[11px] font-semibold uppercase tracking-wider">الساعات</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={28} color={C.error} />
              <Text style={[styles.emptyText, { color: C.error }]}>{error}</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={28} color={C.textSecondary} />
              <Text style={styles.emptyText}>لا توجد سجلات مطابقة</Text>
            </View>
          ) : (
            filteredRecords.map((record) => {
              const isLate = record.status === "late";
              const badgeColor = isLate ? C.error : C.accent;
              const badgeBg = isLate ? C.errorDim : C.accentDim;
              const badgeBorder = isLate ? C.errorBorder : C.accentBorder;

              return (
                <Pressable
                  key={record.id}
                  className="flex flex-col md:flex-row-reverse items-end md:items-center p-4 gap-3 md:gap-0 border-b border-[#ffeba7]/10 hover:bg-[#2c2a25] active:bg-[#2c2a25] transition-colors"
                >
                  {/* 1. الموظف */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[20%]">
                    <Text className="md:hidden text-[#969081] text-xs">الموظف:</Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {record.userName || "—"}
                    </Text>
                  </View>

                  {/* 2. التاريخ */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[15%]">
                    <Text className="md:hidden text-[#969081] text-xs">التاريخ:</Text>
                    <Text style={styles.timeText}>{formatDate(record.date)}</Text>
                  </View>

                  {/* 3. الحضور */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[15%]">
                    <Text className="md:hidden text-[#969081] text-xs">الحضور:</Text>
                    <Text style={styles.timeText}>{formatTime(record.check_in)}</Text>
                  </View>

                  {/* 4. الانصراف */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[15%]">
                    <Text className="md:hidden text-[#969081] text-xs">الانصراف:</Text>
                    <Text style={styles.timeText}>{formatTime(record.check_out)}</Text>
                  </View>

                  {/* 5. الحالة */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[15%]">
                    <Text className="md:hidden text-[#969081] text-xs">الحالة:</Text>
                    <View style={[styles.badge, { borderColor: badgeBorder, backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{isLate ? "متأخر" : "في الموعد"}</Text>
                    </View>
                  </View>

                  {/* 6. الساعات */}
                  <View className="flex-row-reverse justify-between items-center w-full md:w-[20%]">
                    <Text className="md:hidden text-[#969081] text-xs">الساعات:</Text>
                    <Text style={styles.timeText}>{formatDurationHHMM(record.check_in, record.check_out, record.workDuration)}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
  header: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "right",
    letterSpacing: -0.5,
  },
  filterBar: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: "row-reverse",
    gap: 16,
    flexWrap: "wrap",
  },
  filterGroup: {
    flexGrow: 1,
  },
  filterLabel: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    height: 48,
    backgroundColor: "#1f2029",
    borderWidth: 1,
    borderColor: "#3e3f4b",
    borderRadius: 6,
    color: C.textPrimary,
    paddingHorizontal: 16,
    textAlign: "right",
    fontSize: 14,
    justifyContent: "center",
  },
  dropdownWrap: {
    position: "relative",
    height: 48,
  },
  dropdownIcon: {
    position: "absolute",
    left: 16,
    top: 16,
    pointerEvents: "none",
  },
  dropdownMenu: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#1f2029",
    borderWidth: 1,
    borderColor: "#3e3f4b",
    borderRadius: 6,
    zIndex: 999,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,235,167,0.05)",
  },
  dropdownOptionText: {
    color: C.textPrimary,
    textAlign: "right",
    fontSize: 14,
  },
  bentoCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
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
  tableHeader: {
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  thCell: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  colEmployee: { flex: 2 },
  colDate: { flex: 1.5 },
  colTime: { flex: 1.2 },
  colStatus: { flex: 1.2 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,235,167,0.05)",
  },
  rowAlt: {
    backgroundColor: "rgba(31,32,41,0.3)",
  },
  cell: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  name: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
  },
  timeText: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
  },
  badge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
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
});

export default AttendanceLogsContent;
