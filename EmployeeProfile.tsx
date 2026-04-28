import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUserData } from "./services/authService";
import { User } from "./types";
import EmployeeLayout from "./components/EmployeeLayout";
import { DimensionValue } from 'react-native';
// Design System Tokens (Section 3)
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
  const isDesktop = width >= 768;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      setLoading(false);
      return;
    }

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
  const hydratedUser = currentUser || userData || null;
  const resolvedStartTime =
    (displayUser as any)?.workStartTime ||
    (displayUser as any)?.checkInTime ||
    (currentUser as any)?.checkInTime ||
    "09:00 AM";
  const resolvedEndTime =
    (displayUser as any)?.workEndTime ||
    (displayUser as any)?.checkOutTime ||
    (currentUser as any)?.checkOutTime ||
    "05:00 PM";
  const resolvedAvatar = (hydratedUser as any)?.avatarUrl || (displayUser as any)?.avatarUrl || "";
  const resolvedPhone = (hydratedUser as any)?.phone || (displayUser as any)?.phone || "--";
  const resolvedSalaryRaw = (hydratedUser as any)?.basicSalary || (hydratedUser as any)?.salary || (displayUser as any)?.basicSalary || (displayUser as any)?.salary || "0";
  const resolvedSalaryNumber =
    typeof resolvedSalaryRaw === "number"
      ? resolvedSalaryRaw
      : parseFloat(String(resolvedSalaryRaw).replace(/[^\d.]/g, "")) || 0;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    const raw = timeStr.trim();
    const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHour) {
      const hh = String(parseInt(twelveHour[1], 10)).padStart(2, "0");
      return `${hh}:${twelveHour[2]} ${twelveHour[3].toUpperCase()}`;
    }
    const [h, m] = raw.split(":");
    const parsedHour = parseInt(h, 10);
    const parsedMinute = parseInt((m || "0").replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(parsedHour) || Number.isNaN(parsedMinute)) return "--:--";
    let hour = parsedHour;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, "0")}:${String(parsedMinute).padStart(2, "0")} ${ampm}`;
  };

  const getTimelineStyle = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { left: "0%" as DimensionValue, width: "0%" as DimensionValue };
    const [startH] = startStr.split(":");
    const [endH] = endStr.split(":");
    const startHour = parseInt(startH, 10);
    const endHour = parseInt(endH, 10);
    
    // LTR layout to exactly match UI labels
    const leftPercent = (startHour / 24) * 100;
    
    // Handle overnight shifts
    let widthHours = endHour - startHour;
    if (widthHours < 0) {
      widthHours = 24 - startHour + endHour;
    }
    const widthPercent = (widthHours / 24) * 100;
    
    return { left: `${leftPercent}%` as DimensionValue, width: `${widthPercent}%` as DimensionValue };
  };

  const formatDate = (val: any) => {
    if (!val) return "---";
    try {
      if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString("ar-EG");
      if (typeof val?.toDate === "function") return val.toDate().toLocaleDateString("ar-EG");
      if (val instanceof Date) return val.toLocaleDateString("ar-EG");
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString("ar-EG");
      return String(val);
    } catch {
      return String(val);
    }
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
            <View style={[styles.headerCard, !isDesktop && styles.headerCardMobile]}>
              <View style={[styles.avatarBox, !isDesktop && styles.avatarBoxMobile]}>
                {typeof resolvedAvatar === "string" && resolvedAvatar.trim() ? (
                  <Image
                    source={{ uri: resolvedAvatar }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    {displayUser?.name?.trim() ? (
                      <Text style={styles.avatarFallbackText}>{displayUser.name.trim().charAt(0).toUpperCase()}</Text>
                    ) : (
                      <Ionicons name="person" size={isDesktop ? 56 : 64} color="#52a3ce" />
                    )}
                  </View>
                )}
              </View>
              <View style={[styles.headerInfo, !isDesktop && styles.headerInfoMobile]}>
                <Text style={[styles.userName, !isDesktop && styles.userNameMobile]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {displayUser?.name || "الموظف"}
                </Text>
                <View style={[styles.badgesRow, !isDesktop && styles.badgesRowMobile]}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{displayUser?.status === "inactive" ? "غير نشط" : "نشط"}</Text>
                  </View>
                  <View style={styles.deptBadge}>
                    <Text style={styles.deptBadgeText}>{displayUser?.department || "بدون قسم"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={isDesktop ? styles.desktopGridRow : styles.mobileGridCol}>
              {/* Basic Info Card */}
              <View style={[styles.infoCard, isDesktop && { flex: 2.5 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={24} color={Colors.accent} />
                <Text style={styles.cardTitle}>المعلومات الأساسية</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={[styles.infoItem, { width: isDesktop ? "45%" : "100%" }]}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
                    <Text style={styles.infoValue}>{displayUser?.email || "--"}</Text>
                  </View>
                </View>
                
                <View style={[styles.infoItem, { width: isDesktop ? "45%" : "100%" }]}>
                  <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoLabel}>رقم الهاتف</Text>
                    <Text style={[styles.infoValue, { fontFamily: Typography.fontMono }]}>{resolvedPhone}</Text>
                  </View>
                </View>

                <View style={[styles.infoItem, { width: isDesktop ? "45%" : "100%" }]}>
                  <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoLabel}>القسم</Text>
                    <Text style={styles.infoValue}>{displayUser?.department || "بدون قسم"}</Text>
                  </View>
                </View>

                <View style={[styles.infoItem, { width: isDesktop ? "45%" : "100%" }]}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
                    <Text style={styles.infoValue}>{formatDate(displayUser?.joinDate || (displayUser as any)?.createdAt)}</Text>
                  </View>
                </View>
              </View>
              </View>

              {/* Salary Card */}
              <View style={[styles.salaryCard, isDesktop && { flex: 1 }]}>
                <Text style={styles.salaryLabel}>الراتب الشهري</Text>
                <Text style={[styles.salaryAmount, !isDesktop && { fontSize: 48 }]}>{resolvedSalaryNumber.toLocaleString()}</Text>
                <Text style={styles.salarySub}>ج.م / شهر</Text>
              </View>
            </View>

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
                  <View style={[styles.timelineActive, getTimelineStyle(resolvedStartTime, resolvedEndTime)]} />
                </View>
                <View style={styles.timelineLabels}>
  <Text style={styles.timelineLabel}>00:00</Text>
  {isDesktop && <Text style={styles.timelineLabel}>04:00</Text>}
  <Text style={[styles.timelineLabel, styles.timelineLabelAccent]}>{formatTime(resolvedStartTime)}</Text>
  {isDesktop && <Text style={styles.timelineLabel}>12:00</Text>}
  <Text style={[styles.timelineLabel, styles.timelineLabelAccent]}>{formatTime(resolvedEndTime)}</Text>
  {isDesktop && <Text style={styles.timelineLabel}>20:00</Text>}
  <Text style={styles.timelineLabel}>23:59</Text>
</View>
              </View>

              {/* Start / End Time Cards */}
              <View style={styles.timeCardsRow}>
                <View style={[styles.timeCard, !isDesktop && styles.timeCardMobile]}>
                  <View style={[styles.timeCardIconBox, !isDesktop && styles.timeCardIconBoxMobile]}>
                    <Ionicons name="enter-outline" size={!isDesktop ? 20 : 24} color={Colors.accent} />
                  </View>
                  <View style={styles.timeCardInfo}>
                    <Text style={[styles.timeCardLabel, !isDesktop && styles.timeCardLabelMobile]}>وقت البدء</Text>
                    <Text style={[styles.timeCardValue, !isDesktop && styles.timeCardValueMobile]}>{formatTime(resolvedStartTime)}</Text>
                  </View>
                </View>
                <View style={[styles.timeCard, !isDesktop && styles.timeCardMobile]}>
                  <View style={[styles.timeCardIconBox, !isDesktop && styles.timeCardIconBoxMobile]}>
                    <Ionicons name="exit-outline" size={!isDesktop ? 20 : 24} color={Colors.success} />
                  </View>
                  <View style={styles.timeCardInfo}>
                    <Text style={[styles.timeCardLabel, !isDesktop && styles.timeCardLabelMobile]}>وقت الانتهاء</Text>
                    <Text style={[styles.timeCardValue, !isDesktop && styles.timeCardValueMobile]}>{formatTime(resolvedEndTime)}</Text>
                  </View>
                </View>
              </View>
            </View>

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
    paddingTop: 80, // Large top padding to clear sidebar
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.base,
  },
  loadingWrap: {
    padding: Spacing.xxxl,
    alignItems: "center",
  },
  
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    flexDirection: "row-reverse", // Desktop: Avatar on right, text on left
    alignItems: "center",
    justifyContent: "flex-start", // Pack to right side
    gap: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCardMobile: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
    backgroundColor: "#37352f",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontFamily: Typography.fontLatin,
    fontSize: 34,
    fontWeight: "800",
    color: Colors.accent,
  },
  avatarBoxMobile: {
    marginBottom: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    alignItems: "flex-end", // Right-aligned text
    gap: Spacing.md,
  },
  headerInfoMobile: {
    alignItems: "center", // Centered text on mobile
    marginTop: Spacing.sm,
  },
  userName: {
    fontFamily: Typography.fontLatin,
    fontSize: 40,
    fontWeight: "500",
    color: Colors.textPrimary,
    textAlign: "right",
    letterSpacing: -0.5,
  },
  userNameMobile: {
    textAlign: "center",
    fontSize: 32,
  },
  badgesRow: {
    flexDirection: "row-reverse", // RTL
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  badgesRowMobile: {
    justifyContent: "center",
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

  desktopGridRow: {
    flexDirection: "row-reverse", // Basic Info on right (1st), Salary on left (2nd)
    alignItems: "stretch",
    gap: Spacing.xl,
  },
  mobileGridCol: {
    flexDirection: "column",
    gap: Spacing.xl,
  },

  infoCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
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
    flexDirection: "row-reverse", // Populate right-to-left
    flexWrap: "wrap", // Wrap items to form rows if width is 45%
    gap: Spacing.xl, // Large spacing between rows
  },
  infoItem: {
    // width is set dynamically inline (45% desktop, 100% mobile)
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.lg, // Space between icon and text
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

  salaryCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "flex-end", // Right-aligned matching the image
    justifyContent: "center",
    borderWidth: 1,
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
    flexDirection: "row", // LTR exactly like the image
    justifyContent: "space-between",
    marginTop: Spacing.md,
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
    flexDirection: "row-reverse", // RTL (Start time on right, end time on left)
    gap: Spacing.base,
    justifyContent: "space-between", // Spread cards
    flexWrap: "wrap",
  },
  timeCard: {
    flex: 1,
    minWidth: 120, // Small enough to fit side-by-side on mobile
    backgroundColor: Colors.background, // VERY dark
    borderRadius: Radius.md,
    padding: Spacing.base,
    flexDirection: "row-reverse", // Icon on right, text on left
    alignItems: "center",
    justifyContent: "flex-start", // Pack towards the right side
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeCardMobile: {
    padding: Spacing.md,
    gap: Spacing.sm,
    minWidth: 0,
  },
  timeCardInfo: {
    alignItems: "flex-end", // Align to right since icon is on left of it (wait, RTL means text is on left, icon on right. So text is aligned end)
    gap: 4,
    flexShrink: 1,
  },
  timeCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface, // Lighter than background
    alignItems: "center",
    justifyContent: "center",
  },
  timeCardIconBoxMobile: {
    width: 36,
    height: 36,
  },
  timeCardLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "bold", // Extrabold
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timeCardLabelMobile: {
    fontSize: 9,
  },
  timeCardValue: {
    fontFamily: Typography.fontMono,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: "right",
  },
  timeCardValueMobile: {
    fontSize: Typography.md,
  },

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
