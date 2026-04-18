import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { RootStackParamList } from "./types";

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

  // Fetch today's attendance status - Strict daily cycle logic
  useEffect(() => {
    const fetchTodayCheckStatus = async () => {
      try {
        const userData = await getCurrentUserData();
        if (!userData || !userData.uid) {
          setLoadingCheckStatus(false);
          return;
        }

        // Query: Get latest attendance record (simplify to avoid composite index requirement)
        const q = query(collection(db, "attendance"), where("userId", "==", userData.uid), orderBy("timestamp", "desc"), limit(1));

        const querySnapshot = await getDocs(q);

        // State A: No records found
        if (querySnapshot.empty) {
          setIsCheckedIn(false);
          setHasCompletedShift(false);
          setLoadingCheckStatus(false);
          return;
        }

        // Get the latest record
        const latestDoc = querySnapshot.docs[0];
        const latestData = latestDoc.data();
        const recordTimestamp = latestData.timestamp;

        // Convert Firestore Timestamp to JavaScript Date
        const recordDate = recordTimestamp instanceof Timestamp ? recordTimestamp.toDate() : new Date(recordTimestamp);

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if the record is from TODAY (same day, month, year)
        const isRecordFromToday =
          recordDate.getDate() === today.getDate() &&
          recordDate.getMonth() === today.getMonth() &&
          recordDate.getFullYear() === today.getFullYear();

        // State C: Record is from today and type is 'check-out' -> Shift completed
        if (isRecordFromToday && latestData.type === "check-out") {
          setHasCompletedShift(true);
          setIsCheckedIn(false);
          setLoadingCheckStatus(false);
          return;
        }

        // State B: Record is from today and type is 'check-in' -> Only checked in
        if (isRecordFromToday && latestData.type === "check-in") {
          setIsCheckedIn(true);
          setHasCompletedShift(false);
          setLoadingCheckStatus(false);
          return;
        }

        // State A: Record is NOT from today (or no valid record) -> Ready for new check-in
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

    fetchTodayCheckStatus();
  }, []);

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

      // 4. Determine attendance type based on current state
      const attendanceType = isCheckedIn ? "check-out" : "check-in";

      // 4b. Verify geofence compliance (defense-in-depth check)
      if (!isWithinRadius) {
        Alert.alert("خطأ", "أنت خارج نطاق العمل. لا يمكنك تسجيل الحضور.");
        return;
      }

      // 5. Save attendance record to Firestore with userName
      const attendanceRef = collection(db, "attendance");
      const attendanceData = {
        userId: userData.uid,
        userName: userData.name || userData.email || "Unknown",
        companyId: companyId,
        type: attendanceType,
        timestamp: serverTimestamp(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      await addDoc(attendanceRef, attendanceData);

      // 6. Update states based on attendance type
      if (attendanceType === "check-out") {
        // Just completed check-out
        setHasCompletedShift(true);
        setIsCheckedIn(false);
        Alert.alert("نجاح", "تم تسجيل انصرافك بنجاح!\nتم تسجيل الحضور والانصراف بنجاح. نراك غداً!");
      } else {
        // Just completed check-in
        setIsCheckedIn(true);
        Alert.alert("نجاح", "تم تسجيل حضورك بنجاح!");
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
    <View style={styles.container}>
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

            <TouchableOpacity
              style={[
                styles.button,
                hasCompletedShift ? styles.buttonCompleted : isCheckedIn ? styles.buttonCheckOut : styles.buttonCheckIn,
                (!isWithinRadius || isCheckingIn || hasCompletedShift) && styles.buttonDisabled,
              ]}
              onPress={handleCheckIn}
              disabled={!isWithinRadius || isCheckingIn || hasCompletedShift}
            >
              {isCheckingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {hasCompletedShift ? "انتهى تسجيل الحضور والانصراف لليوم" : isCheckedIn ? "تسجيل الانصراف" : "تسجيل الحضور"}
                </Text>
              )}
            </TouchableOpacity>

            {hasCompletedShift && (
              <View style={styles.completionMessageContainer}>
                <Text style={styles.completionMessage}>تم تسجيل الحضور والانصراف بنجاح. نراك غداً!</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
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
  button: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonCheckIn: { backgroundColor: "#007bff" },
  buttonCheckOut: { backgroundColor: "#dc3545" },
  buttonCompleted: { backgroundColor: "#6c757d" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  completionMessageContainer: {
    marginTop: 15,
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
});

export default EmployeeDashboard;
