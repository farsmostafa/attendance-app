import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface LeaveRequest {
  id?: string;
  userId: string;
  userName?: string;
  type: "leave" | "late";
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at?: string;
  admin_notes?: string;
  resolved_at?: string;
}

/**
 * Submit a new leave/late request
 */
export const submitLeaveRequest = async (
  userId: string,
  userName: string,
  request: Omit<LeaveRequest, "id" | "status" | "created_at" | "userId" | "userName">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "requests"), {
      ...request,
      userId,
      userName,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error: any) {
    console.error("Error submitting request:", error);
    throw new Error(error.message || "فشل في تقديم الطلب");
  }
};

/**
 * Get all requests for an employee
 */
export const getEmployeeRequests = async (userId: string): Promise<LeaveRequest[]> => {
  try {
    const q = query(collection(db, "requests"), where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const requests: LeaveRequest[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      requests.push({
        id: docSnapshot.id,
        userId: data.userId,
        type: data.type,
        date: data.date,
        reason: data.reason,
        status: data.status,
        created_at: data.created_at,
        admin_notes: data.admin_notes,
        resolved_at: data.resolved_at,
      });
    });

    // Sort by created_at descending
    requests.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return requests;
  } catch (error: any) {
    console.error("Error fetching employee requests:", error);
    throw new Error(error.message || "فشل في جلب الطلبات");
  }
};

/**
 * Get all pending requests (for admin)
 */
export const getPendingRequests = async (
  companyId: string,
): Promise<Array<LeaveRequest & { employeeName: string; employeeEmail: string }>> => {
  try {
    // Fetch all pending requests
    const q = query(collection(db, "requests"), where("status", "==", "Pending"));

    const querySnapshot = await getDocs(q);
    const requests: Array<LeaveRequest & { employeeName: string; employeeEmail: string }> = [];

    // For each request, fetch employee details
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const userId = data.userId;

      // Fetch employee details
      const { doc: userDoc, getDoc: userGetDoc } = await import("firebase/firestore");
      const userRef = userDoc(db, "users", userId);
      const userSnap = await userGetDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.company_id === companyId) {
          requests.push({
            id: docSnapshot.id,
            userId: data.userId,
            type: data.type,
            date: data.date,
            reason: data.reason,
            status: data.status,
            created_at: data.created_at,
            admin_notes: data.admin_notes,
            resolved_at: data.resolved_at,
            employeeName: userData.name || "",
            employeeEmail: userData.email || "",
          });
        }
      }
    }

    // Sort by created_at ascending (oldest first)
    requests.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    return requests;
  } catch (error: any) {
    console.error("Error fetching pending requests:", error);
    throw new Error(error.message || "فشل في جلب الطلبات المعلقة");
  }
};

/**
 * Approve a request
 */
export const approveRequest = async (requestId: string, adminNotes?: string): Promise<void> => {
  try {
    const requestRef = doc(db, "requests", requestId);
    await updateDoc(requestRef, {
      status: "Approved",
      admin_notes: adminNotes || "",
      resolved_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error approving request:", error);
    throw new Error(error.message || "فشل في الموافقة على الطلب");
  }
};

/**
 * Reject a request
 */
export const rejectRequest = async (requestId: string, adminNotes?: string): Promise<void> => {
  try {
    const requestRef = doc(db, "requests", requestId);
    await updateDoc(requestRef, {
      status: "Rejected",
      admin_notes: adminNotes || "",
      resolved_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    throw new Error(error.message || "فشل في رفض الطلب");
  }
};
