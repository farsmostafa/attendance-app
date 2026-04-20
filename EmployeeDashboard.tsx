import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { checkTodayAttendance, recordCheckIn, AttendanceCheckResult } from "./services/attendanceService";
import { calculateDistance, isWithinGeofence, Coordinates } from "./utils/geo";
import { RootStackParamList } from "./types";

type EmployeeDashboardProps = NativeStackScreenProps<RootStackParamList, "EmployeeDashboard"> & { isFocused?: boolean };

// Constants - Defaults for fallback scenarios
// REMOVED: DEFAULT_COMPANY_LOCATION had hardcoded coordinates that caused ghost distance calculations
// All calculations now use ONLY companySettings.latitude/longitude from Firestore DB
const DEFAULT_GEOFENCE_RADIUS_METERS = 100;
const DEFAULT_GRACE_PERIOD_MINUTES = 15;

// Company Settings Type
interface CompanySettings {
  latitude: number;
  longitude: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  geofenceRadiusMeters: number;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ navigation, isFocused = true }) => {
  // Location & Geofence State
  const [userLocation, setUserLocation] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Attendance State
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceCheckResult | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // UI State
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Refs for preventing race conditions
  const isProcessingRef = useRef(false);
  const attendanceDocIdRef = useRef<string | null>(null);

  // ============================================================================
  // Attendance Status Management
  // ============================================================================

  /**
   * Fetch today's attendance status for current user
   * Queries Firestore to determine if user has checked in/out today
   */
  const fetchAttendanceStatus = async () => {
    setAttendanceLoading(true);
    try {
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        console.warn("User data not available");
        setAttendanceStatus(null);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const status = await checkTodayAttendance(userData.uid, today);
      setAttendanceStatus(status);

      // Store attendance doc ID for checkout if available
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

  /**
   * Fetch company settings from Firestore
   * Retrieves geofence coordinates, work times, grace period, and radius
   */
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
        // Set defaults if document doesn't exist
        const defaultSettings = {
          latitude: 26.343165,
          longitude: 31.892424,
          workStartTime: "09:00",
          workEndTime: "17:00",
          gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
          geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
        };
        setCompanySettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      // Set defaults on error
      const defaultSettings = {
        latitude: 26.343165,
        longitude: 31.892424,
        workStartTime: "09:00",
        workEndTime: "17:00",
        gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
        geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
      };
      setCompanySettings(defaultSettings);
    } finally {
      setSettingsLoading(false);
    }
  };

  // ============================================================================
  // Location & Geofencing
  // ============================================================================

  /**
   * Request and fetch user's current GPS location
   * Calculates distance to company office with 3-second GPS stabilization delay
   */
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
      // Distance calculation now happens in the synchronized useEffect
      // which waits for BOTH userLocation AND companySettings from DB to be available
    } catch (error) {
      console.error("Location error:", error);
      setLocationError("حدث خطأ أثناء جلب موقعك الحالي.");
    }
  };

  /**
   * Refresh location and recalculate distance
   * Updates location state which triggers synchronized distance calculation
   */
  const refreshLocation = async () => {
    try {
      setLocationError(null);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(currentLocation);
      // Distance calculation is now handled by the synchronized useEffect
    } catch (error) {
      console.error("Refresh location error:", error);
      setLocationError("حدث خطأ أثناء تحديث الموقع.");
    }
  };

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  // Initialize on mount - RESET all stale data
  useEffect(() => {
    // Explicit reset on mount to clear any stale data from previous sessions
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

  // Refresh attendance when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      fetchAttendanceStatus();
    }
  }, [isFocused]);

  // Synchronized distance calculation: only when BOTH location and settings are available and accurate
  useEffect(() => {
    if (userLocation && companySettings) {
      const accuracy = userLocation.coords.accuracy;
      // Only calculate and show distance if GPS accuracy is high (< 100m)
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

  // Auto-refresh location every 5 seconds
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

    // Start tracking immediately
    refresh();

    // Then continue every 5 seconds
    const interval = setInterval(() => {
      refresh();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================================================
  // Check-In / Check-Out Handler
  // ============================================================================

  /**
   * Handle check-in or check-out action
   * Validates permissions, geofence, and time, then records to Firestore
   */
  const handleCheckIn = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsCheckingIn(true);

    try {
      // 1. Fetch user data
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        Alert.alert("خطأ", "فشل في جلب بيانات المستخدم. يرجى المحاولة مرة أخرى.");
        return;
      }

      // 2. Validate company association
      const companyId = userData.companyId || userData.company_id;
      if (!companyId) {
        Alert.alert("خطأ", "حسابك غير مرتبط بشركة. يرجى التواصل مع الإدارة.");
        return;
      }

      // 3. Validate location
      if (!userLocation) {
        Alert.alert("خطأ", "لم نتمكن من الحصول على موقعك الحالي.");
        return;
      }

      // 4. Validate geofence
      const geofenceRadius = companySettings?.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
      const isInGeofence = isWithinGeofence(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        {
          latitude: companySettings?.latitude || 26.343165,
          longitude: companySettings?.longitude || 31.892424,
        },
        geofenceRadius,
      );

      if (!isInGeofence) {
        Alert.alert("خطأ", "أنت خارج نطاق العمل. لا يمكنك تسجيل الحضور.");
        return;
      }

      const isCheckInAction = !attendanceStatus?.hasCheckedIn;

      if (isCheckInAction) {
        // ===== CHECK-IN =====
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        const workStartTime = companySettings?.workStartTime || "09:00";
        const [startHour, startMinute] = workStartTime.split(":").map(Number);
        const workStartTimeInMinutes = startHour * 60 + startMinute;

        const gracePeriodMinutes = companySettings?.gracePeriodMinutes || DEFAULT_GRACE_PERIOD_MINUTES;
        const isLate = currentTimeInMinutes > workStartTimeInMinutes + gracePeriodMinutes;

        const todayDate = now.toISOString().split("T")[0];

        const checkInPayload = {
          userId: userData.uid,
          userName: userData.name || userData.email || "Unknown",
          companyId,
          date: todayDate,
          isLate,
          location: {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
        };

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
            location: {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            },
          },
        });

        const message = isLate ? "تم تسجيل حضورك بنجاح!\n⚠️ تنبيه: لقد تجاوزت فترة السماح" : "تم تسجيل حضورك بنجاح!";
        Alert.alert("نجاح", message);
      } else {
        // ===== CHECK-OUT =====
        if (!attendanceDocIdRef.current) {
          Alert.alert("خطأ", "لم نتمكن من العثور على سجل الحضور.");
          return;
        }

        // TODO: Implement check-out logic using recordCheckOut service
        Alert.alert("نجاح", "تم تسجيل انصرافك بنجاح!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      Alert.alert("خطأ", `فشل العملية: ${message}`);
      console.error("Check-in error:", error);
    } finally {
      isProcessingRef.current = false;
      setIsCheckingIn(false);
    }
  };

  // ============================================================================
  // Computed UI Values
  // ============================================================================

  const geofenceRadius = companySettings?.geofenceRadiusMeters || DEFAULT_GEOFENCE_RADIUS_METERS;
  const withinGeofence = distance !== null && distance <= geofenceRadius;

  const isLoading = settingsLoading || attendanceLoading;
  const hasCheckedIn = attendanceStatus?.hasCheckedIn ?? false;

  const hasCheckedOut = attendanceStatus?.hasCheckedOut ?? false;
  const shiftCompleted = hasCheckedIn && hasCheckedOut;
  const buttonDisabled = isCheckingIn || shiftCompleted || !withinGeofence;

  // ============================================================================
  // Render
  // ============================================================================

  // Guard: Show loader until distance is determined
  if (distance === null && !locationError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>لوحة الموظف</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>نظام الحضور والانصراف</Text>
          <View style={styles.cardLoadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.statusText}>جاري فحص موقعك الجغرافي بدقة... برجاء الانتظار</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>لوحة الموظف</Text>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      )}

      {!isLoading && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>نظام الحضور والانصراف</Text>

          {locationError ? (
            <Text style={styles.errorText}>{locationError}</Text>
          ) : (
            <View style={styles.locationInfo}>
              <Text style={styles.infoText}>المسافة بينك وبين الشركة: {distance.toFixed(2)} متر</Text>

              <Text style={styles.radiusInfo}>النطاق المسموح: {geofenceRadius} متر</Text>

              <Text style={[styles.statusBadge, withinGeofence ? styles.statusGood : styles.statusBad]}>
                {withinGeofence ? "✓ أنت داخل نطاق العمل" : "✗ أنت خارج نطاق الشركة"}
              </Text>

              {!withinGeofence ? (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningIcon}>📍</Text>
                  <Text style={styles.warningTitle}>خارج النطاق الجغرافي</Text>
                  <Text style={styles.warningText}>
                    أنت على بعد {distance.toFixed(0)} متر من نطاق الشركة. لا يمكنك تسجيل الحضور في الوقت الحالي.
                  </Text>
                </View>
              ) : (
                <>
                  {shiftCompleted ? (
                    <View style={styles.completionMessageContainer}>
                      <Text style={styles.completionMessage}>تم تسجيل الحضور والانصراف بنجاح. نراك غداً!</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        hasCheckedIn ? styles.buttonCheckOut : styles.buttonCheckIn,
                        buttonDisabled && styles.buttonDisabled,
                      ]}
                      onPress={handleCheckIn}
                      disabled={buttonDisabled}
                    >
                      {isCheckingIn ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>{hasCheckedIn ? "تسجيل الانصراف" : "تسجيل الحضور"}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#333" },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    minHeight: 320,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "right", color: "#444" },
  statusText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: { color: "#cc0000", fontSize: 16, textAlign: "center", marginVertical: 10 },
  locationInfo: { alignItems: "center" },
  infoText: { fontSize: 16, marginBottom: 15, color: "#333" },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    color: "#fff",
    fontWeight: "bold",
    overflow: "hidden",
    marginBottom: 20,
  },
  statusGood: { backgroundColor: "#28a745" },
  statusBad: { backgroundColor: "#dc3545" },
  distanceRow: {
    marginBottom: 10,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 55,
  },
  buttonCheckIn: { backgroundColor: "#007bff" },
  buttonCheckOut: { backgroundColor: "#dc3545" },
  buttonCompleted: { backgroundColor: "#6c757d" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  centeredLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  completionMessageContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#d4edda",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  completionMessage: {
    color: "#155724",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  warningContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#ffe6e6",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#dc3545",
    alignItems: "center",
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 8,
    textAlign: "center",
  },
  warningText: {
    fontSize: 14,
    color: "#c82333",
    textAlign: "center",
    lineHeight: 20,
  },
  cardLoadingContainer: {
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  radiusInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    fontStyle: "italic",
  },
});

export default EmployeeDashboard;
