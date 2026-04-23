import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Animated, useWindowDimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { getDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { checkTodayAttendance, recordCheckIn, recordCheckOut, AttendanceCheckResult } from "./services/attendanceService";
import { calculateDistance, isWithinGeofence } from "./utils/geo";
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
  info: "#90caf9",
  overlay: "rgba(0, 0, 0, 0.5)",
  outOfRange: "#4a3728",  // Stitch State 2: Out-of-range button (dark brown)
};
const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };
const Radius = { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 };
const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30,
  fontArabic: "Cairo" as const,
  fontLatin: "Manrope" as const,
  fontMono: "SpaceMono" as const,
};
const Shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
};

type EmployeeDashboardProps = NativeStackScreenProps<RootStackParamList, "EmployeeDashboard"> & { isFocused?: boolean };

const DEFAULT_GEOFENCE_RADIUS_METERS = 100;
const DEFAULT_GRACE_PERIOD_MINUTES = 15;

interface CompanySettings {
  latitude: number;
  longitude: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  geofenceRadiusMeters: number;
}

interface LiveGeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function EmployeeDashboard({ navigation, isFocused = true }: EmployeeDashboardProps) {
  const { width } = useWindowDimensions();
  const [userLocation, setUserLocation] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceCheckResult | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>("--");

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const isProcessingRef = useRef(false);
  const attendanceDocIdRef = useRef<string | null>(null);
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.42)).current;

  const fetchAttendanceStatus = async () => {
    setAttendanceLoading(true);
    try {
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        console.warn("User data not available");
        setAttendanceStatus(null);
        return;
      }
      setEmployeeName(userData.name || userData.email || "--");

      const today = new Date().toISOString().split("T")[0];
      const status = await checkTodayAttendance(userData.uid, today);
      setAttendanceStatus(status);

      if (status.checkInRecord?.id) {
        attendanceDocIdRef.current = status.checkInRecord.id;
      }
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      setAttendanceStatus(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    setSettingsLoading(true);
    try {
      const companyDoc = await getDoc(doc(db, "companies", "MainCompany"));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        const settings = {
          latitude: data.latitude || 26.343165,
          longitude: data.longitude || 31.892424,
          workStartTime: data.workStartTime || "09:00",
          workEndTime: data.workEndTime || "17:00",
          gracePeriodMinutes: data.gracePeriodMinutes || DEFAULT_GRACE_PERIOD_MINUTES,
          geofenceRadiusMeters: data.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS,
        };
        setCompanySettings(settings);
      } else {
        setCompanySettings({
          latitude: 26.343165,
          longitude: 31.892424,
          workStartTime: "09:00",
          workEndTime: "17:00",
          gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
          geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
        });
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      setCompanySettings({
        latitude: 26.343165,
        longitude: 31.892424,
        workStartTime: "09:00",
        workEndTime: "17:00",
        gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
        geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("تم رفض صلاحية الوصول للموقع. لا يمكنك تسجيل الحضور.");
        return;
      }

      // Fix 1A: Added timeInterval to prevent infinite hang on iOS cold GPS start
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      setUserLocation(currentLocation);
      setLocationError(null);
    } catch (error) {
      console.error("Location error:", error);
      setLocationError("تعذر تحديد موقعك الحالي. يرجى التحقق من صلاحيات الموقع.");
    }
  };

  const refreshLocation = async () => {
    try {
      setLocationError(null);
      // Fix 1A: Added timeInterval to prevent infinite hang
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      setUserLocation(currentLocation);
    } catch (error) {
      console.error("Refresh location error:", error);
      setLocationError("تعذر تحديث الموقع. حاول مجدداً.");
    }
  };

  useEffect(() => {
    setUserLocation(null);
    setDistance(null);
    setCompanySettings(null);
    setLocationError(null);

    const initialize = async () => {
      await fetchCompanySettings();
      await fetchAttendanceStatus();
      await initializeLocation();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchAttendanceStatus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (userLocation && companySettings) {
      // Fix 1B: Removed accuracy gate — always calculate distance.
      // Previously, accuracy >= 100m blocked setDistance, keeping distance===null forever.
      const dist = calculateDistance(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        { latitude: companySettings.latitude, longitude: companySettings.longitude },
      );
      setDistance(dist);
    }
  }, [userLocation, companySettings]);

  useEffect(() => {
    const refresh = async () => {
      try {
        // Fix 1A: Added timeInterval to prevent infinite hang on iOS
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
        setUserLocation(currentLocation);
      } catch (error) {
        console.error("Auto-refresh location error:", error);
        // Don't overwrite a more descriptive error from initializeLocation
        setLocationError((prev) => prev || "تعذر تحديث الموقع تلقائياً.");
      }
    };

    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 10000); // Increased to 10s to reduce battery drain

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showAlert = (message: string) => {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    } else {
      Alert.alert("تنبيه", message);
    }
  };

  const getLiveNavigatorPosition = async (): Promise<LiveGeolocationPosition | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  };

  const handleCheckIn = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsCheckingIn(true);

    try {
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        showAlert("خطأ: فشل في جلب بيانات المستخدم. يرجى المحاولة مرة أخرى.");
        return;
      }

      const companyId = userData.companyId || userData.company_id;
      if (!companyId) {
        showAlert("خطأ: حسابك غير مرتبط بشركة. يرجى التواصل مع الإدارة.");
        return;
      }

      let currentLocation = userLocation;
      try {
        const freshLocation = await Location.getCurrentPositionAsync({});
        currentLocation = freshLocation;
      } catch (gpsError) {
        console.warn("Failed to refresh location, using cached:", gpsError);
        if (!userLocation) {
          showAlert("خطأ: لم نتمكن من الحصول على موقعك الحالي.");
          return;
        }
      }

      if (!currentLocation) {
        showAlert("خطأ: لم نتمكن من الحصول على موقعك الحالي.");
        return;
      }

      const geofenceRadius = companySettings?.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
      const isInGeofence = isWithinGeofence(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: companySettings?.latitude || 26.343165,
          longitude: companySettings?.longitude || 31.892424,
        },
        geofenceRadius,
      );

      if (!isInGeofence) {
        showAlert("فشل الإجراء: أنت الآن خارج نطاق العمل");
        return;
      }

      const now = new Date();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

      const workStartTime = companySettings?.workStartTime || "09:00";
      const [startHour, startMinute] = workStartTime.split(":").map(Number);
      const workStartTimeInMinutes = startHour * 60 + startMinute;

      const gracePeriodMinutes = companySettings?.gracePeriodMinutes || DEFAULT_GRACE_PERIOD_MINUTES;
      const isLate = currentTimeInMinutes > workStartTimeInMinutes + gracePeriodMinutes;
      const status = (isLate ? "late" : "on-time") as "on-time" | "late";

      const todayDate = now.toISOString().split("T")[0];

      const checkInPayload = {
        userId: userData.uid,
        userName: userData.name || userData.email || "Unknown",
        companyId,
        date: todayDate,
        isLate,
        status,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
      };

      const livePosition = await getLiveNavigatorPosition();
      if (livePosition && companySettings) {
        const liveDistance = calculateDistance(
          {
            latitude: livePosition.coords.latitude,
            longitude: livePosition.coords.longitude,
          },
          {
            latitude: companySettings.latitude,
            longitude: companySettings.longitude,
          },
        );

        if (liveDistance > 100) {
          showAlert("عذراً، أنت خارج نطاق العمل الآن");
          return;
        }
      }

      try {
        const docId = await recordCheckIn(checkInPayload);
        attendanceDocIdRef.current = docId;

        setAttendanceStatus({
          hasCheckedIn: true,
          hasCheckedOut: false,
          checkInRecord: {
            id: docId,
            userId: userData.uid,
            date: todayDate,
            check_in: {} as any,
            isLate,
            status,
            location: {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            },
          },
        });

        const message = isLate ? "✓ تم تسجيل حضورك بنجاح!\n⚠️ تنبيه: لقد تجاوزت فترة السماح" : "✓ تم تسجيل حضورك بنجاح!";
        showAlert(message);
        console.log("Check-in successful:", docId);
        await fetchAttendanceStatus();
      } catch (checkInError) {
        console.error("Check-in DB Error:", checkInError);
        showAlert(`خطأ في تسجيل الحضور: ${checkInError instanceof Error ? checkInError.message : "خطأ غير معروف"}`);
        throw checkInError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      console.error("Check-in error:", error);
      showAlert(`فشل تسجيل الحضور: ${message}`);
    } finally {
      isProcessingRef.current = false;
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsCheckingOut(true);

    try {
      let clickLocation = userLocation;
      try {
        const freshLocation = await Location.getCurrentPositionAsync({});
        clickLocation = freshLocation;
        setUserLocation(freshLocation);
      } catch (gpsError) {
        console.warn("Failed to refresh location for check-out:", gpsError);
        if (!userLocation) {
          showAlert("خطأ: لم نتمكن من الحصول على موقعك الحالي.");
          return;
        }
      }

      const geofenceRadius = companySettings?.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
      const isInGeofence = isWithinGeofence(
        {
          latitude: clickLocation?.coords.latitude || 0,
          longitude: clickLocation?.coords.longitude || 0,
        },
        {
          latitude: companySettings?.latitude || 26.343165,
          longitude: companySettings?.longitude || 31.892424,
        },
        geofenceRadius,
      );

      if (!isInGeofence) {
        showAlert("فشل الإجراء: أنت الآن خارج نطاق العمل");
        return;
      }

      const livePosition = await getLiveNavigatorPosition();
      if (livePosition && companySettings) {
        const liveDistance = calculateDistance(
          {
            latitude: livePosition.coords.latitude,
            longitude: livePosition.coords.longitude,
          },
          {
            latitude: companySettings.latitude,
            longitude: companySettings.longitude,
          },
        );

        if (liveDistance > 100) {
          showAlert("عذراً، أنت خارج نطاق العمل الآن");
          return;
        }
      }

      const docId = attendanceDocIdRef.current || attendanceStatus?.checkInRecord?.id;
      if (!docId) {
        showAlert("خطأ: لم نتمكن من العثور على سجل الحضور.");
        console.error("Check-out failed: No attendance document ID found");
        return;
      }

      try {
        await recordCheckOut(docId);

        setAttendanceStatus({
          hasCheckedIn: true,
          hasCheckedOut: true,
          checkInRecord: attendanceStatus?.checkInRecord,
        });

        showAlert("✓ تم تسجيل انصرافك بنجاح!");
        console.log("Check-out successful:", docId);
        await fetchAttendanceStatus();
      } catch (checkOutError) {
        console.error("Check-out Error:", checkOutError);
        showAlert(`خطأ في تسجيل الانصراف: ${checkOutError instanceof Error ? checkOutError.message : "خطأ غير معروف"}`);
        throw checkOutError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      console.error("Check-out error:", error);
      showAlert(`فشل تسجيل الانصراف: ${message}`);
    } finally {
      isProcessingRef.current = false;
      setIsCheckingOut(false);
    }
  };

  const geofenceRadius = companySettings?.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
  const withinGeofence = distance !== null && distance <= geofenceRadius;

  // Fix 1C: Loading gate now only depends on Firebase data fetches.
  // Location (distance) is shown inline — never blocks the full UI.
  const isLoading = settingsLoading || attendanceLoading;
  const hasCheckedIn = attendanceStatus?.hasCheckedIn ?? false;
  const hasCheckedOut = attendanceStatus?.hasCheckedOut ?? false;
  const shiftCompleted = hasCheckedIn && hasCheckedOut;
  const isProcessing = isCheckingIn || isCheckingOut;
  const buttonDisabled = isProcessing || shiftCompleted || !withinGeofence;
  const showPulse = withinGeofence && !shiftCompleted && !isProcessing && !locationError;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (showPulse) {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.42);
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.35,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    } else {
      pulseScale.stopAnimation();
      pulseOpacity.stopAnimation();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }

    return () => {
      if (pulseLoop) {
        pulseLoop.stop();
      }
    };
  }, [showPulse, pulseScale, pulseOpacity]);

  // ── 4-State Dashboard (Stitch MCP screens) ──
  type DashboardState = "checkin" | "outOfRange" | "checkout" | "completed";
  const dashboardState: DashboardState = shiftCompleted
    ? "completed"
    : hasCheckedIn && withinGeofence
      ? "checkout"
      : !withinGeofence
        ? "outOfRange"
        : "checkin";

  const stateConfig = {
    checkin:    { label: "تسجيل الحضور",    subtitle: "بدء الدوام",                    icon: "finger-print" as const },
    outOfRange: { label: "خارج نطاق العمل",  subtitle: "LOCATION ACCESS RESTRICTED", icon: "location-outline" as const },
    checkout:   { label: "تسجيل الانصراف",   subtitle: "إنهاء الدوام",                  icon: "finger-print" as const },
    completed:  { label: "دوامك انتهى لليوم", subtitle: "شكراً لالتزامك في الدوام",     icon: "checkmark-done" as const },
  };
  const { label: actionLabel, subtitle: actionSubtitle, icon: actionIcon } = stateConfig[dashboardState];

  const todayRecord = attendanceStatus?.checkInRecord;
  const formatTimeValue = (value: any): string => {
    try {
      if (!value) return "--";
      if (typeof value.toDate === "function") {
        return value.toDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
      if (value instanceof Date) {
        return value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
      return "--";
    } catch {
      return "--";
    }
  };
  const formatDuration = (minutes?: number): string => {
    if (typeof minutes !== "number" || Number.isNaN(minutes)) return "--";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toLocaleString("en-US")} س ${mins.toLocaleString("en-US")} د`;
  };

  const dateLabel = currentDateTime.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fullTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const timeParts = fullTime.split(" ");
  const timeDigits = timeParts[0] || fullTime;
  const timePeriod = timeParts[1] || "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.mainContent,{ paddingVertical: 25}, { maxWidth: width > 1024 ? 720 : "100%" }]}>
        {/* ── Clock Section (Stitch: Clock Section) ── */}
        <View style={styles.clockSection}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <View style={styles.clockRow}>
            {/* RTL: period appears on the leading (right) side */}
            <Text style={styles.clockPeriod}>{timePeriod}</Text>
            <Text style={styles.clockText}>{timeDigits}</Text>
          </View>
        </View>

        {isLoading ? (
          // Fix 1C: Spinner only for Firebase data — location is shown inline below
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : (
          <>
            {/* ── Square Check-in Button (Stitch: 4-State Central Action) ── */}
            <View style={styles.actionZone}>
              {showPulse && (
                <Animated.View
                  style={[
                    styles.pulseSquare,
                    dashboardState === "checkout" ? styles.pulseCheckOut : styles.pulseCheckIn,
                    { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                  ]}
                />
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.squareButton,
                  styles[`squareButton_${dashboardState}`],
                  dashboardState === "checkin" && styles.squareButtonGlow,
                  buttonDisabled && styles.buttonDisabled,
                  pressed && !buttonDisabled && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={hasCheckedIn ? handleCheckOut : handleCheckIn}
                disabled={buttonDisabled}
              >
                {isProcessing ? (
                  <ActivityIndicator
                    size="large"
                    color={dashboardState === "checkin" ? Colors.accentText : Colors.textPrimary}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={actionIcon}
                      size={56}
                      color={
                        dashboardState === "checkin" || dashboardState === "checkout"
                          ? Colors.accentText
                          : dashboardState === "completed"
                            ? Colors.accent
                            : dashboardState === "outOfRange"
                              ? Colors.textSecondary
                              : Colors.textPrimary
                      }
                    />
                    <Text
                      style={[
                        styles.squareButtonLabel,
                        dashboardState === "checkin" || dashboardState === "checkout"
                          ? { color: Colors.accentText }
                          : dashboardState === "outOfRange"
                            ? { color: Colors.textSecondary }
                            : { color: Colors.textPrimary },
                      ]}
                    >
                      {actionLabel}
                    </Text>
                    <Text
                      style={[
                        styles.squareButtonSub,
                        dashboardState === "checkin" || dashboardState === "checkout"
                          ? { color: Colors.accentText, opacity: 0.7 }
                          : dashboardState === "outOfRange"
                            ? { color: Colors.textSecondary, opacity: 0.7 }
                            : { color: Colors.textSecondary },
                      ]}
                    >
                      {actionSubtitle}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* ── GPS Location Card (Stitch: GPS Location Card) ── */}
            <View style={[styles.card, Shadow.card]}>
              <View style={styles.cardRow}>
                <View style={styles.cardRowStart}>
                  <View style={styles.iconBox}>
                    <Ionicons name="location" size={22} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>بعد موقعي عن مكان العمل</Text>
                    {locationError ? (
                      <Text style={styles.errorText}>{locationError}</Text>
                    ) : (
                      <Text style={styles.cardValue}>
                        {Number(distance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} متر
                      </Text>
                    )}
                  </View>
                </View>
                {!locationError && (
                  <View style={[styles.statusChip, withinGeofence ? styles.statusChipGood : styles.statusChipBad]}>
                    <View style={[styles.statusDot, withinGeofence ? styles.statusDotGood : styles.statusDotBad]} />
                    <Text style={[styles.statusChipText, withinGeofence ? { color: Colors.accent } : { color: Colors.error }]}>
                      {withinGeofence ? "داخل نطاق العمل" : "خارج نطاق العمل"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Summary Card (Stitch: Summary Card) ── */}
            <View style={[styles.card, Shadow.card]}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>ملخص اليوم</Text>
                <Ionicons name="analytics-outline" size={22} color={Colors.textSecondary} />
              </View>

              {/* Employee Name */}
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemStart}>
                  <Ionicons name="person-outline" size={18} color={Colors.accent} />
                  <Text style={styles.summaryItemLabel}>اسم الموظف</Text>
                </View>
                <Text style={styles.summaryItemValue}>{employeeName}</Text>
              </View>

              {/* Check-in */}
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemStart}>
                  <Ionicons name="log-in-outline" size={18} color={Colors.accent} />
                  <Text style={styles.summaryItemLabel}>وقت الحضور</Text>
                </View>
                <Text style={styles.summaryItemValue}>{formatTimeValue(todayRecord?.check_in)}</Text>
              </View>

              {/* Check-out */}
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemStart}>
                  <Ionicons name="log-out-outline" size={18} color={Colors.accent} />
                  <Text style={styles.summaryItemLabel}>وقت الانصراف</Text>
                </View>
                <Text style={styles.summaryItemValue}>{formatTimeValue(todayRecord?.check_out)}</Text>
              </View>

              {/* Duration */}
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemStart}>
                  <Ionicons name="timer-outline" size={18} color={Colors.accent} />
                  <Text style={styles.summaryItemLabel}>إجمالي الساعات</Text>
                </View>
                <Text style={styles.summaryItemValue}>{formatDuration(todayRecord?.workDuration)}</Text>
              </View>

              {/* Status */}
              <View style={[styles.summaryItem, styles.summaryItemLast]}>
                <View style={styles.summaryItemStart}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
                  <Text style={styles.summaryItemLabel}>الحالة</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    !hasCheckedIn ? styles.statusPillNeutral : todayRecord?.isLate ? styles.statusPillLate : styles.statusPillOnTime,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      !hasCheckedIn
                        ? { color: Colors.error }
                        : todayRecord?.isLate
                          ? { color: Colors.error }
                          : { color: Colors.success },
                    ]}
                  >
                    {!hasCheckedIn ? "لم يتم التسجيل" : todayRecord?.isLate ? "متأخر" : "في الموعد"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ── STYLES — Design Tokens (Section 3) — RTL compliant ──
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
    gap: Spacing.xl,
  },

  // ── Clock (Stitch: Clock Section) ──
  clockSection: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  dateLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.md,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  clockText: {
    fontFamily: Typography.fontMono,
    fontSize: 56,
    fontWeight: "900",
    color: Colors.accent,
    textAlign: "center",
    letterSpacing: -2,
  },
  clockPeriod: {
    fontFamily: Typography.fontLatin,
    fontSize: Typography.xl,
    fontWeight: "800",
    color: Colors.accent,
    opacity: 0.6,
  },

  // ── Loading ──
  loadingContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: Typography.fontArabic,
    marginTop: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // ── Square Action Button (Stitch: 4-State Central Action) ──
  actionZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  pulseSquare: {
    position: "absolute",
    width: 272,
    height: 272,
    borderRadius: Radius.xl,
  },
  pulseCheckIn: { backgroundColor: Colors.accent },
  pulseCheckOut: { backgroundColor: Colors.error },
  squareButton: {
    width: 256,
    height: 256,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.base,
  },
  // Stitch State 1: Check-in — Yellow accent
  squareButton_checkin: { backgroundColor: Colors.accent },
  // Stitch State 2: Out of Range — Dark surface, disabled
  squareButton_outOfRange: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 },
  // Stitch State 3: Check-out — Coral/salmon
  squareButton_checkout: { backgroundColor: Colors.error },
  // Stitch State 4: Completed — Dark surface
  squareButton_completed: { backgroundColor: Colors.surfaceElevated },
  squareButtonGlow: {
    ...Shadow.glow,
  },
  squareButtonLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xl,
    fontWeight: "900",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  squareButtonSub: {
    fontFamily: Typography.fontLatin,
    fontSize: Typography.xs,
    fontWeight: "700",
    textAlign: "center",
    marginTop: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  buttonDisabled: { opacity: 0.5 },

  // ── Cards (Stitch: etched-border surface containers) ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },

  // ── GPS Card (Stitch: GPS Location Card) ──
  cardRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardRowStart: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "right",
  },
  cardValue: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  errorText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    color: Colors.error,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  statusChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: Spacing.sm,
  },
  statusChipGood: {
    backgroundColor: "rgba(255, 235, 167, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 235, 167, 0.3)",
  },
  statusChipBad: {
    backgroundColor: "rgba(255, 180, 171, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.3)",
  },
  statusDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Radius.full,
  },
  statusDotGood: { backgroundColor: Colors.accent },
  statusDotBad: { backgroundColor: Colors.error },
  statusChipText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    fontWeight: "700",
  },

  // ── Summary Card (Stitch: Summary Card) ──
  summaryHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "right",
  },
  summaryItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryItemLast: {
    marginBottom: 0,
  },
  summaryItemStart: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  summaryItemLabel: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  summaryItemValue: {
    fontFamily: Typography.fontMono,
    fontSize: Typography.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "left",
    maxWidth: "50%",
  },

  // ── Status Pills (Stitch: Status badge) ──
  statusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusPillLate: {
    backgroundColor: "rgba(255, 180, 171, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.2)",
  },
  statusPillOnTime: {
    backgroundColor: "rgba(171, 207, 178, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(171, 207, 178, 0.2)",
  },
  statusPillNeutral: {
    backgroundColor: "rgba(255, 180, 171, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.2)",
  },
  statusPillText: {
    fontFamily: Typography.fontArabic,
    fontSize: Typography.xs,
    fontWeight: "700",
  },
});

