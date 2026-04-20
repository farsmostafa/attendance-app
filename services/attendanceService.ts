/**
 * Attendance Service - Clean Firestore operations for attendance tracking
 * Handles check-in/check-out and attendance queries
 */

import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Coordinates } from "../utils/geo";

export interface AttendanceCheckResult {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInRecord?: CheckInRecord;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  date: string;
  check_in: Timestamp;
  check_out?: Timestamp;
  isLate: boolean;
  status: "on-time" | "late";
  location: Coordinates;
  workDuration?: number;
}

export interface CheckInPayload {
  userId: string;
  userName: string;
  companyId: string;
  date: string;
  isLate: boolean;
  status: "on-time" | "late";
  location: Coordinates;
}

/**
 * Query today's attendance record for a user
 * Returns check-in status and existing record if found
 *
 * @param userId - User's Firebase UID
 * @param todayDate - Date in YYYY-MM-DD format
 * @returns Attendance status and record details
 */
export const checkTodayAttendance = async (userId: string, todayDate: string): Promise<AttendanceCheckResult> => {
  try {
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId),
      where("date", "==", todayDate),
      orderBy("check_in", "desc"),
      limit(1),
    );

    const querySnapshot = await getDocs(attendanceQuery);

    if (querySnapshot.empty) {
      return {
        hasCheckedIn: false,
        hasCheckedOut: false,
      };
    }

    const recordDoc = querySnapshot.docs[0];
    const recordData = recordDoc.data();

    const checkInRecord: CheckInRecord = {
      id: recordDoc.id,
      userId: recordData.userId,
      date: recordData.date,
      check_in: recordData.check_in,
      check_out: recordData.check_out,
      isLate: recordData.isLate,
      status: recordData.status || (recordData.isLate ? "late" : "on-time"),
      location: recordData.location,
      workDuration: recordData.workDuration,
    };

    return {
      hasCheckedIn: !!recordData.check_in,
      hasCheckedOut: !!recordData.check_out,
      checkInRecord,
    };
  } catch (error) {
    console.error("Error checking attendance:", error);
    throw error;
  }
};

/**
 * Record a new check-in to Firestore
 * Creates a new attendance document with check-in timestamp and metadata
 *
 * @param payload - Check-in information (userId, userName, companyId, date, isLate, location)
 * @returns Document ID of the created attendance record
 */
export const recordCheckIn = async (payload: CheckInPayload): Promise<string> => {
  try {
    const attendanceData = {
      userId: payload.userId,
      userName: payload.userName,
      companyId: payload.companyId,
      date: payload.date,
      check_in: serverTimestamp(),
      isLate: payload.isLate,
      status: payload.status,
      location: {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
      },
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "attendance"), attendanceData);
    console.log("Check-in recorded successfully:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error recording check-in:", error);
    throw error;
  }
};

/**
 * Record a check-out for an existing attendance record
 * Updates the record with check_out timestamp and calculates work duration
 *
 * @param attendanceDocId - ID of the attendance document to update
 * @returns Updated document reference
 */
export const recordCheckOut = async (attendanceDocId: string): Promise<void> => {
  try {
    const attendanceDocRef = doc(db, "attendance", attendanceDocId);

    // Get current record to calculate work duration
    const attendanceSnap = await getDocs(query(collection(db, "attendance"), where("__name__", "==", attendanceDocId)));

    if (!attendanceSnap.empty) {
      const recordData = attendanceSnap.docs[0].data();
      const checkInTime = recordData.check_in.toDate();
      const checkOutTime = new Date();
      const workDurationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

      await updateDoc(attendanceDocRef, {
        check_out: serverTimestamp(),
        workDuration: workDurationMinutes,
      });

      console.log("Check-out recorded successfully");
    }
  } catch (error) {
    console.error("Error recording check-out:", error);
    throw error;
  }
};
