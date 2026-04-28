import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface FinancialRecord {
  id?: string;
  userId: string;
  type: "bonus" | "deduction";
  amount: number;
  reason: string;
  date: string;
  created_at?: string;
}

export interface FinancialSummary {
  totalBonuses: number;
  totalDeductions: number;
  absencePenalty: number;
  expectedSalary: number;
}

/**
 * Add a bonus or deduction record
 */
export const addFinancialRecord = async (record: FinancialRecord): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "financial_records"), {
      ...record,
      created_at: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error: any) {
    console.error("Error adding financial record:", error);
    throw new Error(error.message || "فشل في حفظ السجل المالي");
  }
};

/**
 * Get financial summary for an employee for the current month
 */
export const getMonthlyFinancialSummary = async (userId: string, basicSalary: number): Promise<FinancialSummary> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get financial records
    const q = query(collection(db, "financial_records"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    let totalBonuses = 0;
    let totalDeductions = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const recordDate = new Date(data.date);

      // Check if record is within current month
      if (recordDate >= startOfMonth && recordDate < endOfMonth) {
        if (data.type === "bonus") {
          totalBonuses += data.amount || 0;
        } else if (data.type === "deduction") {
          totalDeductions += data.amount || 0;
        }
      }
    });

    // Get approved leave requests to exclude from absence penalty
    let absencePenalty = 0;
    try {
      const leaveQuery = query(
        collection(db, "requests"),
        where("userId", "==", userId),
        where("status", "==", "Approved"),
        where("type", "==", "leave"),
      );

      const leaveSnapshot = await getDocs(leaveQuery);
      const approvedLeaves = leaveSnapshot.docs
        .map((doc) => doc.data().date)
        .filter((date) => {
          const leaveDate = new Date(date);
          return leaveDate >= startOfMonth && leaveDate < endOfMonth;
        });

      // Get attendance records for the month
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId));

      const attendanceSnapshot = await getDocs(attendanceQuery);
      let absenceDays = 0;

      const processedDates = new Set<string>();

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        const attendanceDate = new Date(data.check_in || data.date);
        const dateStr = attendanceDate.toISOString().split("T")[0];

        if (attendanceDate >= startOfMonth && attendanceDate < endOfMonth && !processedDates.has(dateStr)) {
          processedDates.add(dateStr);

          // Check if it's an absence (no check_in) or no check-out
          const hasCheckIn = data.check_in;
          const hasCheckOut = data.check_out;

          if (!hasCheckIn || !hasCheckOut) {
            // Only count as absence if not approved leave
            if (!approvedLeaves.includes(dateStr)) {
              absenceDays += 1;
            }
          }
        }
      });

      // Assuming each absence day costs 50 EGP
      absencePenalty = absenceDays * 50;
    } catch (error) {
      // If there's an error checking leaves, just use 0
      absencePenalty = 0;
    }

    // Calculate expected salary
    const expectedSalary = basicSalary + totalBonuses - totalDeductions - absencePenalty;

    return {
      totalBonuses,
      totalDeductions,
      absencePenalty,
      expectedSalary,
    };
  } catch (error: any) {
    console.error("Error getting financial summary:", error);
    throw new Error(error.message || "فشل في حساب الملخص المالي");
  }
};

/**
 * Get all financial records for an employee for the current month
 */
export const getMonthlyFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const q = query(collection(db, "financial_records"), where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const records: FinancialRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const recordDate = new Date(data.date);

      // Check if record is within current month
      if (recordDate >= startOfMonth && recordDate < endOfMonth) {
        records.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          reason: data.reason,
          date: data.date,
        });
      }
    });

    return records;
  } catch (error: any) {
    console.error("Error fetching financial records:", error);
    throw new Error(error.message || "فشل في جلب السجلات المالية");
  }
};
