/**
 * Attendance Service - Clean Firestore operations for attendance tracking
 * Handles check-in/check-out and attendance queries
 */

import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Coordinates } from "../utils/geo";
import { getCurrentCairoDateString } from "../utils/timeUtils";

export interface AttendanceCheckResult {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInRecord?: CheckInRecord;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  userName?: string;
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

export const getTodayRecord = async (uid: string, companyId: string): Promise<CheckInRecord | null> => {
  const todayDate = getCurrentCairoDateString();

  const toRecord = (recordDoc: any): CheckInRecord => {
    const data = recordDoc.data();
    return {
      id: recordDoc.id,
      userId: data.userId || data.employeeId || uid,
      userName: data.userName,
      date: data.date,
      check_in: data.check_in || data.checkInTime,
      check_out: data.check_out || data.checkOutTime,
      checkInTime: data.checkInTime || data.check_in || null,
      checkOutTime: data.checkOutTime || data.check_out || null,
      isLate: !!data.isLate,
      status: data.status || (data.isLate ? "late" : "on-time"),
      location: data.location,
      workDuration: data.workDuration,
    } as CheckInRecord;
  };

  // Primary query requested by product spec: employeeId + companyId + date
  const byEmployeeId = query(
    collection(db, "attendance"),
    where("employeeId", "==", uid),
    where("companyId", "==", companyId),
    where("date", "==", todayDate),
    orderBy("check_in", "desc"),
    limit(1),
  );

  const byEmployeeIdSnap = await getDocs(byEmployeeId);
  if (!byEmployeeIdSnap.empty) {
    return toRecord(byEmployeeIdSnap.docs[0]);
  }

  // Backward compatibility for existing records using userId
  const byUserId = query(
    collection(db, "attendance"),
    where("userId", "==", uid),
    where("companyId", "==", companyId),
    where("date", "==", todayDate),
    orderBy("check_in", "desc"),
    limit(1),
  );

  const byUserIdSnap = await getDocs(byUserId);
  if (!byUserIdSnap.empty) {
    return toRecord(byUserIdSnap.docs[0]);
  }

  return null;
};

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
      employeeId: payload.userId,
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

/**
 * Fetch all attendance records for admin dashboard
 * Returns records ordered by date and check_in time (descending)
 *
 * @returns Array of attendance records
 */
export const fetchAllAttendanceRecords = async (): Promise<CheckInRecord[]> => {
  try {
    const attendanceQuery = query(collection(db, "attendance"), orderBy("date", "desc"), orderBy("check_in", "desc"));

    const querySnapshot = await getDocs(attendanceQuery);
    const records: CheckInRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        date: data.date,
        check_in: data.check_in,
        check_out: data.check_out,
        isLate: data.isLate,
        status: data.status || (data.isLate ? "late" : "on-time"),
        location: data.location,
        workDuration: data.workDuration,
      });
    });

    return records;
  } catch (error) {
    console.error("Error fetching all attendance records:", error);
    throw error;
  }
};

/**
 * Fetch today's attendance records for admin dashboard
 * Returns records for today's date, ordered by check_in time (descending)
 *
 * @param todayDate - Date in YYYY-MM-DD format
 * @returns Array of today's attendance records
 */
export const fetchTodaysAttendanceRecords = async (todayDate: string): Promise<CheckInRecord[]> => {
  try {
    const attendanceQuery = query(collection(db, "attendance"), where("date", "==", todayDate), orderBy("check_in", "desc"));

    const querySnapshot = await getDocs(attendanceQuery);
    const records: CheckInRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        date: data.date,
        check_in: data.check_in,
        check_out: data.check_out,
        isLate: data.isLate,
        status: data.status || (data.isLate ? "late" : "on-time"),
        location: data.location,
        workDuration: data.workDuration,
      });
    });

    return records;
  } catch (error) {
    console.error("Error fetching today's attendance records:", error);
    throw error;
  }
};

/**
 * Count employees present today (who have checked in)
 *
 * @param todayDate - Date in YYYY-MM-DD format
 * @returns Number of unique employees checked in today
 */
export const countPresentToday = async (todayDate: string): Promise<number> => {
  try {
    const attendanceQuery = query(collection(db, "attendance"), where("date", "==", todayDate));

    const querySnapshot = await getDocs(attendanceQuery);
    const uniqueUserIds = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        uniqueUserIds.add(data.userId);
      }
    });

    return uniqueUserIds.size;
  } catch (error) {
    console.error("Error counting present today:", error);
    throw error;
  }
};

/**
 * Fetch present employees count for multiple dates.
 * Counts unique userIds per date (multiple check-ins by same user/day count once).
 *
 * @param dates - Array of dates in YYYY-MM-DD format
 * @returns Object keyed by date with unique present count
 */
export const fetchPresentCountsByDates = async (dates: string[]): Promise<Record<string, number>> => {
  try {
    const sanitizedDates = Array.from(new Set(dates.filter(Boolean)));
    const countsByDate: Record<string, number> = {};

    sanitizedDates.forEach((date) => {
      countsByDate[date] = 0;
    });

    if (sanitizedDates.length === 0) {
      return countsByDate;
    }

    const uniqueByDate = new Map<string, Set<string>>();
    sanitizedDates.forEach((date) => {
      uniqueByDate.set(date, new Set<string>());
    });

    const chunkSize = 10; // Firestore "in" query supports up to 10 values
    for (let i = 0; i < sanitizedDates.length; i += chunkSize) {
      const datesChunk = sanitizedDates.slice(i, i + chunkSize);
      const attendanceQuery = query(collection(db, "attendance"), where("date", "in", datesChunk));
      const querySnapshot = await getDocs(attendanceQuery);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date as string | undefined;
        const userId = data.userId as string | undefined;

        if (!date || !userId) {
          return;
        }

        const dateSet = uniqueByDate.get(date);
        if (dateSet) {
          dateSet.add(userId);
        }
      });
    }

    uniqueByDate.forEach((uniqueUsers, date) => {
      countsByDate[date] = uniqueUsers.size;
    });

    return countsByDate;
  } catch (error) {
    console.error("Error fetching present counts by dates:", error);
    throw error;
  }
};
