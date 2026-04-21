import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { getDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { checkTodayAttendance, recordCheckIn, recordCheckOut, AttendanceCheckResult } from "./services/attendanceService";
import { calculateDistance, isWithinGeofence } from "./utils/geo";
import { RootStackParamList } from "./types";

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

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ navigation, isFocused = true }) => {
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

      const currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(currentLocation);
      setLocationError(null);
    } catch (error) {
      console.error("Location error:", error);
      setLocationError("حدث خطأ أثناء جلب موقعك الحالي.");
    }
  };

  const refreshLocation = async () => {
    try {
      setLocationError(null);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(currentLocation);
    } catch (error) {
      console.error("Refresh location error:", error);
      setLocationError("حدث خطأ أثناء تحديث الموقع.");
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
      const accuracy = userLocation.coords.accuracy;
      if (accuracy < 100) {
        const dist = calculateDistance(
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          { latitude: companySettings.latitude, longitude: companySettings.longitude },
        );
        setDistance(dist);
      }
    }
  }, [userLocation, companySettings]);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLocationError(null);
        const currentLocation = await Location.getCurrentPositionAsync({});
        setUserLocation(currentLocation);
      } catch (error) {
        console.error("Auto-refresh location error:", error);
        setLocationError("حدث خطأ أثناء تحديث الموقع.");
      }
    };

    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 5000);

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
      const status = isLate ? "late" : "on-time";

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

  const actionLabel = shiftCompleted ? "تم إنهاء الدوام" : hasCheckedIn ? "تسجيل الانصراف" : "تسجيل الحضور";
  const actionSubtitle = shiftCompleted ? "اكتمل يوم العمل" : hasCheckedIn ? "إنهاء الدوام" : "بدء الدوام";

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

  const dateLabel = currentDateTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.headerWrap}>
          <Text style={styles.brandName}>دوّمت</Text>
          <Text style={styles.headerTitle}>لوحة الموظف</Text>
          <Text style={styles.headerSubtitle}>نظام حضور احترافي وآمن</Text>
        </View>

        {isLoading || distance === null ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffeba7" />
            <Text style={styles.loadingText}>جاري التحقق من البيانات والموقع...</Text>
          </View>
        ) : (
          <>
            <View style={styles.actionZone}>
              {showPulse && <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />}
              <View
                style={[
                  styles.progressRing,
                  shiftCompleted ? styles.progressRingCompleted : hasCheckedIn ? styles.progressRingCheckOut : styles.progressRingCheckIn,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.circleButton,
                    shiftCompleted ? styles.circleButtonCompleted : hasCheckedIn ? styles.circleButtonCheckOut : styles.circleButtonCheckIn,
                    buttonDisabled && styles.buttonDisabled,
                  ]}
                  onPress={hasCheckedIn ? handleCheckOut : handleCheckIn}
                  disabled={buttonDisabled}
                  activeOpacity={0.9}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={hasCheckedIn ? "#fff" : "#102770"} />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.circleButtonText,
                          shiftCompleted ? styles.buttonTextCompleted : hasCheckedIn ? styles.buttonTextCheckOut : styles.buttonTextCheckIn,
                        ]}
                      >
                        {actionLabel}
                      </Text>
                      <Text
                        style={[
                          styles.circleButtonSubText,
                          shiftCompleted ? styles.buttonTextCompleted : hasCheckedIn ? styles.buttonTextCheckOut : styles.buttonTextCheckIn,
                        ]}
                      >
                        {actionSubtitle}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>الوقت والتاريخ</Text>
              <Text style={styles.clockText}>{timeLabel}</Text>
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>حالة الموقع</Text>
              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : (
                <>
                  <Text style={styles.infoText}>
                    المسافة الحالية: {Number(distance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} متر
                  </Text>
                  <Text style={styles.infoSubText}>النطاق المسموح: {Number(geofenceRadius).toLocaleString("en-US")} متر</Text>
                  <Text style={[styles.statusBadge, withinGeofence ? styles.statusGood : styles.statusBad]}>
                    {withinGeofence ? "أنت داخل نطاق العمل" : "أنت خارج نطاق العمل"}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ملخص حضور اليوم</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="person-outline" size={18} color="#3b82f6" />
                  <Text style={styles.summaryLabel}>اسم الموظف</Text>
                </View>
                <Text style={styles.summaryValue}>{employeeName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="log-in-outline" size={18} color="#22c55e" />
                  <Text style={styles.summaryLabel}>وقت الحضور</Text>
                </View>
                <Text style={styles.summaryValue}>{formatTimeValue(todayRecord?.check_in)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  <Text style={styles.summaryLabel}>وقت الانصراف</Text>
                </View>
                <Text style={styles.summaryValue}>{formatTimeValue(todayRecord?.check_out)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="time-outline" size={18} color="#f59e0b" />
                  <Text style={styles.summaryLabel}>إجمالي الساعات</Text>
                </View>
                <Text style={styles.summaryValue}>{formatDuration(todayRecord?.workDuration)}</Text>
              </View>
              <View style={styles.summaryRowLast}>
                <View style={styles.summaryLabelWrap}>
                  <Ionicons name="alert-circle-outline" size={18} color={todayRecord?.isLate ? "#ef4444" : "#22c55e"} />
                  <Text style={styles.summaryLabel}>حالة الالتزام</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    !hasCheckedIn ? styles.statusPillNeutral : todayRecord?.isLate ? styles.statusPillLate : styles.statusPillOnTime,
                  ]}
                >
                  <Text style={styles.statusPillText}>{!hasCheckedIn ? "--" : todayRecord?.isLate ? "متأخر" : "في الموعد"}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
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
    maxWidth: 560,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2a2b38",
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6f7384",
    marginTop: 4,
  },
  loadingContainer: {
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
  actionZone: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  pulseRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#ffeba7",
  },
  progressRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  progressRingCheckIn: {
    borderColor: "#ffeba7",
  },
  progressRingCheckOut: {
    borderColor: "#dc3545",
  },
  progressRingCompleted: {
    borderColor: "#4b5563",
  },
  circleButton: {
    width: 178,
    height: 178,
    borderRadius: 89,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  circleButtonCheckIn: {
    backgroundColor: "#ffeba7",
  },
  circleButtonCheckOut: {
    backgroundColor: "#dc3545",
  },
  circleButtonCompleted: {
    backgroundColor: "#4b5563",
  },
  circleButtonText: {
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  circleButtonSubText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionCard: {
    width: "92%",
    alignSelf: "center",
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eceffd",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: "800",
    color: "#2a2b38",
    marginBottom: 8,
  },
  clockText: {
    textAlign: "right",
    fontSize: 24,
    fontWeight: "900",
    color: "#2a2b38",
  },
  dateText: {
    textAlign: "right",
    marginTop: 4,
    color: "#676d83",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#cc0000",
    fontSize: 14,
    textAlign: "right",
    marginVertical: 2,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
    color: "#2a2b38",
    textAlign: "right",
    fontWeight: "700",
  },
  infoSubText: {
    fontSize: 13,
    marginBottom: 8,
    color: "#6d7285",
    textAlign: "right",
  },
  statusBadge: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    color: "#fff",
    fontWeight: "800",
    textAlign: "right",
    fontSize: 12,
  },
  statusGood: { backgroundColor: "#2a2b38" },
  statusBad: { backgroundColor: "#dc3545" },
  summaryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  summaryRowLast: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  summaryLabelWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: {
    color: "#7f8598",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#2a2b38",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
    maxWidth: "72%",
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
  statusPillNeutral: {
    backgroundColor: "#6b7280",
  },
  statusPillText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonTextCheckIn: { color: "#102770" },
  buttonTextCheckOut: { color: "#fff" },
  buttonTextCompleted: { color: "#fff" },
});

export default EmployeeDashboard;
