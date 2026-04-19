import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { RootStackParamList, AttendanceRecord } from "./types";

type EmployeeDashboardProps = NativeStackScreenProps<RootStackParamList, "EmployeeDashboard">;

// Company location coordinates (Girga - Sohag)
const COMPANY_LOCATION = {
  latitude: 26.336796,
  longitude: 31.891085,
};

// Allowed radius for check-in (in meters)
const ALLOWED_RADIUS_METERS = 50;

// Haversine formula to calculate accurate distance between two points on the map (in meters)
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ navigation }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCompletedShift, setHasCompletedShift] = useState(false);
  const [loadingCheckStatus, setLoadingCheckStatus] = useState(true);
  const isProcessingRef = useRef(false);

  // Function to fetch today's attendance status
  const fetchTodayCheckStatus = async () => {
    try {
      const userData = await getCurrentUserData();
      if (!userData || !userData.uid) {
        setLoadingCheckStatus(false);
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayDateString = today.toISOString().split("T")[0];

      // Query: Get today's attendance record for current user
      const q = query(
        collection(db, "attendance"),
        where("userId", "==", userData.uid),
        where("date", "==", todayDateString),
        orderBy("check_in", "desc"),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      // No record for today -> Ready for check-in
      if (querySnapshot.empty) {
        setIsCheckedIn(false);
        setHasCompletedShift(false);
        setLoadingCheckStatus(false);
        return;
      }

      // Get today's attendance record
      const attendanceDoc = querySnapshot.docs[0];
      const attendanceData = attendanceDoc.data() as AttendanceRecord;

      // If check_out exists -> Shift completed
      if (attendanceData.check_out) {
        setHasCompletedShift(true);
        setIsCheckedIn(false);
        setLoadingCheckStatus(false);
        return;
      }

      // If only check_in exists -> Currently checked in
      if (attendanceData.check_in) {
        setIsCheckedIn(true);
        setHasCompletedShift(false);
        setLoadingCheckStatus(false);
        return;
      }

      // Default state
      setIsCheckedIn(false);
      setHasCompletedShift(false);
    } catch (err) {
      console.error("Error fetching check status:", err);
      setIsCheckedIn(false);
      setHasCompletedShift(false);
    } finally {
      setLoadingCheckStatus(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTodayCheckStatus();
  }, []);

  // Refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchTodayCheckStatus();
    }, []),
  );

  // Location permission and distance calculation
  useEffect(() => {
    (async () => {
      // 1. Request location permission from user
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("تم رفض صلاحية الوصول للموقع. لا يمكنك تسجيل الحضور.");
        return;
      }

      // 2. Get current employee location
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // 3. Calculate distance between employee and company
        const dist = getDistanceInMeters(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          COMPANY_LOCATION.latitude,
          COMPANY_LOCATION.longitude,
        );
        setDistance(dist);
      } catch (err) {
        setErrorMsg("حدث خطأ أثناء جلب موقعك الحالي.");
      }
    })();
  }, []);

  const handleCheckIn = async () => {
    // Prevent multiple rapid clicks
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setIsCheckingIn(true);

    try {
      // 1. Fetch current user data
      const userData = await getCurrentUserData();
      if (!userData || !userData.uid) {
        Alert.alert("خطأ", "فشل في جلب بيانات المستخدم. يرجى المحاولة مرة أخرى.");
        return;
      }

      // 2. Validate company_id
      const companyId = userData.company_id;
      if (!companyId) {
        Alert.alert("خطأ", "حسابك غير مرتبط بشركة. يرجى التواصل مع الإدارة.");
        return;
      }

      // 3. Get current location (already available)
      if (!location) {
        Alert.alert("خطأ", "لم نتمكن من الحصول على موقعك الحالي.");
        return;
      }

      // 4. Verify geofence compliance (defense-in-depth check)
      if (!isWithinRadius) {
        Alert.alert("خطأ", "أنت خارج نطاق العمل. لا يمكنك تسجيل الحضور.");
        return;
      }

      // 5. Determine attendance action based on current state
      const isCheckInAction = !isCheckedIn;

      if (isCheckInAction) {
        // === CHECK-IN LOGIC ===
        // Calculate isLate: compare current time with workStartTime + 15 min grace period
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Parse user's workStartTime (format: "HH:mm")
        const workStartTime = userData.workStartTime || "09:00";
        const [startHour, startMinute] = workStartTime.split(":").map(Number);
        const workStartTimeInMinutes = startHour * 60 + startMinute;

        // Grace period: 15 minutes
        const gracePeriodinMinutes = 15;
        const isLate = currentTimeInMinutes > workStartTimeInMinutes + gracePeriodinMinutes;

        // Get today's date in YYYY-MM-DD format
        const todayDateString = now.toISOString().split("T")[0];

        // Create new attendance record
        const attendanceRef = collection(db, "attendance");
        const attendanceData = {
          userId: userData.uid,
          userName: userData.name || userData.email || "Unknown",
          companyId: companyId,
          date: todayDateString, // YYYY-MM-DD format
          check_in: serverTimestamp(),
          isLate: isLate,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          created_at: serverTimestamp(),
        };

        await addDoc(attendanceRef, attendanceData);

        // Update states
        setIsCheckedIn(true);
        Alert.alert("نجاح", isLate ? "تم تسجيل حضورك بنجاح!\n⚠️ تنبيه: لقد تجاوزت فترة السماح (15 دقيقة)" : "تم تسجيل حضورك بنجاح!");
      } else {
        // === CHECK-OUT LOGIC ===
        // Find today's check-in record
        const today = new Date();
        const todayDateString = today.toISOString().split("T")[0];

        const q = query(
          collection(db, "attendance"),
          where("userId", "==", userData.uid),
          where("date", "==", todayDateString),
          orderBy("check_in", "desc"),
          limit(1),
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("خطأ", "لم نتمكن من العثور على سجل الحضور لهذا اليوم.");
          return;
        }

        const attendanceDoc = querySnapshot.docs[0];
        const attendanceRecord = attendanceDoc.data() as AttendanceRecord;
        const checkInTime =
          attendanceRecord.check_in instanceof Timestamp ? attendanceRecord.check_in.toDate() : new Date(attendanceRecord.check_in);

        // Calculate work duration in minutes
        const checkOutTime = new Date();
        const workDurationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

        // Update the attendance record with check_out and workDuration
        const attendanceDocRef = doc(db, "attendance", attendanceDoc.id);
        await updateDoc(attendanceDocRef, {
          check_out: serverTimestamp(),
          workDuration: Math.max(0, workDurationMinutes), // Ensure non-negative
          updated_at: serverTimestamp(),
        });

        // Update states
        setHasCompletedShift(true);
        setIsCheckedIn(false);
        Alert.alert(
          "نجاح",
          `تم تسجيل انصرافك بنجاح!\nمدة العمل: ${Math.floor(workDurationMinutes / 60)} ساعة و ${workDurationMinutes % 60} دقيقة`,
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      Alert.alert("خطأ", `فشل العملية: ${errorMessage}`);
      console.error("Attendance error:", err);
    } finally {
      isProcessingRef.current = false;
      setIsCheckingIn(false);
    }
  };

  // Check if employee is within allowed radius
  const isWithinRadius = distance !== null && distance <= ALLOWED_RADIUS_METERS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>لوحة الموظف</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>نظام الحضور والانصراف</Text>

        {!location && !errorMsg ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.statusText}>جاري تحديد موقعك...</Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <View style={styles.locationInfo}>
            <Text style={styles.infoText}>المسافة بينك وبين الشركة: {distance ? distance.toFixed(2) : "--"} متر</Text>

            <Text style={[styles.statusBadge, isWithinRadius ? styles.statusGood : styles.statusBad]}>
              {isWithinRadius ? "أنت داخل نطاق العمل" : "أنت خارج نطاق الشركة"}
            </Text>

            {/* Show warning when outside radius, hide button */}
            {!isWithinRadius ? (
              <View style={styles.warningContainer}>
                <Text style={styles.warningIcon}>📍</Text>
                <Text style={styles.warningTitle}>خارج النطاق الجغرافي</Text>
                <Text style={styles.warningText}>أنت خارج منطقة الشركة. لا يمكنك تسجيل الحضور في الوقت الحالي.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  hasCompletedShift ? styles.buttonCompleted : isCheckedIn ? styles.buttonCheckOut : styles.buttonCheckIn,
                  (isCheckingIn || hasCompletedShift) && styles.buttonDisabled,
                ]}
                onPress={handleCheckIn}
                disabled={isCheckingIn || hasCompletedShift}
              >
                {isCheckingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText} numberOfLines={2} adjustsFontSizeToFit>
                    {hasCompletedShift ? "انتهى تسجيل الحضور والانصراف لليوم" : isCheckedIn ? "تسجيل الانصراف" : "تسجيل الحضور"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {hasCompletedShift && (
              <View style={styles.completionMessageContainer}>
                <Text style={styles.completionMessage}>تم تسجيل الحضور والانصراف بنجاح. نراك غداً!</Text>
              </View>
            )}
          </View>
        )}
      </View>
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
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "right", color: "#444" },
  loadingContainer: { alignItems: "center", marginVertical: 20 },
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
});

export default EmployeeDashboard;
