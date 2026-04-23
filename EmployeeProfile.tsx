import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUserData } from "./services/authService";
import { User } from "./types";
import EmployeeLayout from "./components/EmployeeLayout";
import { DimensionValue } from 'react-native';
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
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 32,
  fontArabic: "Cairo" as const,
  fontLatin: "Manrope" as const,
  fontMono: "SpaceMono" as const,
};

type EmployeeProfileProps = {
  navigation?: any;
  userData?: User;
};

const EmployeeProfile = ({ navigation, userData }: EmployeeProfileProps) => {
  const { width } = useWindowDimensions();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const loggedInUser = await getCurrentUserData();
        setCurrentUser(loggedInUser);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const displayUser = userData || currentUser;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour < 10 ? "0" + hour : hour}:${m} ${ampm}`;
  };

  const getTimelineStyle = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { right: "0%" as DimensionValue, width: "0%" as DimensionValue };
    const [startH] = startStr.split(":");
    const [endH] = endStr.split(":");
    const startHour = parseInt(startH, 10);
    const endHour = parseInt(endH, 10);
    
    // RTL layout - right position is based on start hour
    const rightPercent = (startHour / 24) * 100;
    
    // Handle overnight shifts
    let widthHours = endHour - startHour;
    if (widthHours < 0) {
      widthHours = 24 - startHour + endHour;
    }
    const widthPercent = (widthHours / 24) * 100;
    
    return { right: `${rightPercent}%` as DimensionValue, width: `${widthPercent}%` as DimensionValue };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const renderTimelineLabel = (timeStr: string, displayStr?: string, isAccent: boolean = false) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    let min = parseInt(m || "0", 10);
    const rightPercent = ((hour + min / 60) / 24) * 100;
    
    return (
      <View style={[styles.timelineLabelWrapper, { right: `${rightPercent}%` }]} key={timeStr + (displayStr || "")}>
        <Text style={[styles.timelineLabel, isAccent && styles.timelineLabelAccent]}>
          {displayStr || timeStr}
        </Text>
      </View>
    );
  };

  const handleEditProfile = () => {
    // Placeholder for edit action if it exists
    console.log("Edit Profile Clicked");
  };

  const content = (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.mainContent}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <>
            {/* ── 1. Profile Header Card ── */}
            <View style={styles.headerCard}>
              <View style={styles.avatarBox}>
                <Ionicons name="person" size={56} color={Colors.accent} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.userName}>{displayUser?.name || "الموظف"}</Text>
                <View style={styles.badgesRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{displayUser?.status === 'inactive' ? 'غير نشط' : 'نشط'}</Text>
                  </View>
                  <View style={styles.deptBadge}>
                    <Text style={styles.deptBadgeText}>{displayUser?.department || "بدون قسم"}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── 2. Grid Row: Basic Info & Salary ── */}
            <View style={styles.gridRow}>
              {/* Basic Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="person-circle-outline" size={24} color={Colors.accent} />
                  <Text style={styles.cardTitle}>المعلومات الأساسية</Text>
                </View>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
                      <Text style={styles.infoValue}>{displayUser?.email || "--"}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>رقم الهاتف</Text>
                      <Text style={[styles.infoValue, { fontFamily: Typography.fontMono }]}>{displayUser?.phone || "--"}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>القسم</Text>
                      <Text style={styles.infoValue}>{displayUser?.department || "--"}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                    <View style={styles.infoTextCol}>
                      <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
                      <Text style={styles.infoValue}>{formatDate(displayUser?.joinDate || (displayUser as any)?.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Salary Card */}
              <View style={styles.salaryCard}>
                <Text style={styles.salaryLabel}>الراتب الشهري</Text>
                <Text style={styles.salaryAmount}>{displayUser?.basicSalary ? displayUser.basicSalary.toLocaleString() : "--"}</Text>
                <Text style={styles.salarySub}>ج.م / شهر</Text>
              </View>
            </View>

            {/* ── 3. Working Hours Card ── */}
            <View style={styles.hoursCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={24} color={Colors.accent} />
                <Text style={styles.cardTitle}>ساعات العمل</Text>
                <View style={styles.shiftBadge}>
                  <Text style={styles.shiftBadgeText}>دوام يومي</Text>
                </View>
              </View>

              {/* Timeline Bar UI */}
              <View style={styles.timelineContainer}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineActive, getTimelineStyle(displayUser?.workStartTime || "09:00", displayUser?.workEndTime || "17:00")]} />
                </View>
                <View style={styles.timelineLabels}>
                  {renderTimelineLabel("00:00", "00:00")}
                  {renderTimelineLabel("04:00", "04:00")}
                  {renderTimelineLabel(displayUser?.workStartTime || "08:00", formatTime(displayUser?.workStartTime || "08:00"), true)}
                  {renderTimelineLabel("12:00", "12:00")}
                  {renderTimelineLabel(displayUser?.workEndTime || "17:00", formatTime(displayUser?.workEndTime || "17:00"), true)}
                  {renderTimelineLabel("20:00", "20:00")}
                  {renderTimelineLabel("23:59", "23:59")}
                </View>
              </View>

              {/* Start / End Time Cards */}
              <View style={styles.timeCardsRow}>
                <View style={styles.timeCard}>
                  <View style={styles.timeCardInfo}>
                    <Text style={styles.timeCardLabel}>وقت البدء</Text>
                    <Text style={styles.timeCardValue}>{formatTime(displayUser?.workStartTime)}</Text>
                  </View>
                  <View style={styles.timeCardIconBox}>
                    <Ionicons name="enter-outline" size={24} color={Colors.accent} />
                  </View>
                </View>
                <View style={styles.timeCard}>
                  <View style={styles.timeCardInfo}>
                    <Text style={styles.timeCardLabel}>وقت الانتهاء</Text>
                    <Text style={styles.timeCardValue}>{formatTime(displayUser?.workEndTime)}</Text>
                  </View>
                  <View style={styles.timeCardIconBox}>
                    <Ionicons name="exit-outline" size={24} color={Colors.success} />
                  </View>
                </View>
              </View>
            </View>

            {/* ── 4. Footer Actions ── */}
            <View style={styles.footerRow}>
              {currentUser?.role === "admin" && (
                <Pressable style={styles.editButton} onPress={handleEditProfile}>
                  <Text style={styles.editButtonText}>تعديل الملف الشخصي</Text>
                </Pressable>
              )}
              <View style={[styles.updateInfoRow, currentUser?.role !== "admin" && { flex: 1, justifyContent: "flex-end" }]}>
                <Text style={styles.updateInfoText}>آخر تحديث للبيانات: {formatDate(new Date().toISOString())}</Text>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );

  if (userData) {
    return content;
  }

  return (
    <EmployeeLayout navigation={navigation!} activeRoute="EmployeeProfile" showLoading={loading}>
      {content}
    </EmployeeLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  mainContent: {
    width: "100%",
    maxWidth: 1000,
    gap: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.base,
  },
  loadingWrap: {
    padding: Spacing.xxxl,
    alignItems: "center",
  },
  
  // ── Header Card ──
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl, // 24px padding
    flexDirection: "row-reverse", // RTL
    alignItems: "center",
    gap: Spacing.xl, // 24px gap
    borderWidth: 1, // Brutalist 1px border
    borderColor: Colors.border,
  },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    borderWidth: 2, // Highlighted Avatar border
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "flex-end", // RTL
    gap: Spacing.md,
  },
  userName: {
    fontFamily: Typography.fontLatin,
    fontSize: 40,
    fontWeight: "500", // Regular/Medium like image
    color: Colors.textPrimary,
    textAlign: "right",
    letterSpacing: -0.5,
  },
  badgesRow: {
    flexDirection: "row-reverse", // RTL
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontFamily: Typography.fontArabic,
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deptBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  deptBadgeText: {
    fontFamily: Typography.fontArabic,
    color: Colors.accent,
    fontSize: Typography.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Grid Layout ──
  gridRow: {
    flexDirection: "row-reverse", // RTL
    flexWrap: "wrap",
    gap: Spacing.xl,
  },

  // ── Basic Info Card ──
  infoCard: {
    flex: 2,
    minWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1, // Brutalist 1px border
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row-reverse", // RTL
    alignItems: "center",
    justifyContent: "flex-start", // Start from right
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.base,
    fontWeight: "bold", // Bold for section headers
    color: Colors.textPrimary,
  },
  infoGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.xl,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.md,
  },
  infoTextCol: {
    alignItems: "flex-end", // text right-aligned
    gap: 4,
  },
  infoLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: Typography.fontLatin,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },

  // ── Salary Card ──
  salaryCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1, // Brutalist 1px border
    borderColor: Colors.border,
  },
  salaryLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  salaryAmount: {
    fontFamily: Typography.fontArabic,
    fontSize: 56, // Massive amount
    fontWeight: "bold",
    color: Colors.accent,
    letterSpacing: -1,
  },
  salarySub: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },

  // ── Working Hours Card ──
  hoursCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1, // Brutalist 1px border
    borderColor: Colors.border,
  },
  shiftBadge: {
    backgroundColor: Colors.background, // very dark
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginLeft: "auto", // Push to far left in row-reverse
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shiftBadgeText: {
    fontFamily: Typography.fontArabic,
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  timelineContainer: {
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  timelineTrack: {
    height: 12, // Thicker track
    backgroundColor: Colors.surfaceElevated, // Dark track
    borderRadius: Radius.full,
    flexDirection: "row",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  timelineActive: {
    position: "absolute",
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  timelineLabels: {
    height: 20,
    position: "relative",
    marginTop: Spacing.md,
  },
  timelineLabelWrapper: {
    position: "absolute",
    width: 60,
    transform: [{ translateX: 30 }], // Center over the exact percentage point
    alignItems: "center",
  },
  timelineLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "bold",
  },
  timelineLabelAccent: {
    color: Colors.accent,
    fontWeight: "bold",
  },
  timeCardsRow: {
    flexDirection: "row-reverse", // RTL
    gap: Spacing.base,
    flexWrap: "wrap",
  },
  timeCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Colors.background, // VERY dark
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingLeft: Spacing.lg,
    flexDirection: "row-reverse", // RTL
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeCardInfo: {
    alignItems: "flex-end", // Align to right since icon is on left of it (wait, RTL means text is on left, icon on right. So text is aligned end)
    gap: 4,
  },
  timeCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface, // Lighter than background
    alignItems: "center",
    justifyContent: "center",
  },
  timeCardLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "bold", // Extrabold
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timeCardValue: {
    fontFamily: Typography.fontMono,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },

  // ── Footer ──
  footerRow: {
    flexDirection: "row-reverse", // RTL
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
  editButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  editButtonText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    fontWeight: "800",
    color: Colors.accentText,
  },
  updateInfoRow: {
    flexDirection: "row-reverse", // RTL
    alignItems: "center",
    gap: Spacing.xs,
  },
  updateInfoText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
});

export default EmployeeProfile;
