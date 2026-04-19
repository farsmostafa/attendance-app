import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { secondaryAuth } from "../firebaseConfig";
import { db } from "../firebaseConfig";

export interface NewEmployeeData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  workStartTime?: string;
  joinDate?: string;
  status?: "active" | "inactive";
  role: "employee" | "admin";
  basicSalary?: number;
  basic_salary?: number; // Legacy support
}

/**
 * Create a new employee user without logging out the admin
 * Uses a secondary Firebase Auth instance to create the user
 */
export const createNewEmployee = async (
  employeeData: NewEmployeeData,
  adminCompanyId: string,
): Promise<{ uid: string; message: string }> => {
  try {
    // Create user with secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, employeeData.email, employeeData.password);

    const uid = userCredential.user.uid;

    // Prepare user data for Firestore
    const basicSalary = employeeData.basicSalary || employeeData.basic_salary || 0;
    const userData: any = {
      uid,
      name: employeeData.name,
      email: employeeData.email,
      role: employeeData.role,
      basicSalary: basicSalary,
      basic_salary: basicSalary, // Legacy support
      company_id: adminCompanyId,
      phone: employeeData.phone || "",
      department: employeeData.department || "",
      workStartTime: employeeData.workStartTime || "09:00",
      joinDate: employeeData.joinDate || new Date().toISOString().split("T")[0],
      status: employeeData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save user data to Firestore users collection
    await setDoc(doc(db, "users", uid), userData);

    // Sign out from secondary auth to prevent unwanted session changes
    await signOut(secondaryAuth);

    return {
      uid,
      message: `تم إنشاء الموظف ${employeeData.name} بنجاح`,
    };
  } catch (error: any) {
    console.error("Error creating employee:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-in-use") {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    } else if (error.code === "auth/weak-password") {
      throw new Error("كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("البريد الإلكتروني غير صحيح");
    }

    throw new Error(error.message || "فشل في إنشاء الموظف");
  }
};

/**
 * Fetch all employees for a company
 */
export const fetchCompanyEmployees = async (
  companyId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    basic_salary: number;
    role: string;
  }>
> => {
  try {
    const q = query(collection(db, "users"), where("company_id", "==", companyId), where("role", "==", "employee"));

    const querySnapshot = await getDocs(q);
    const employees: Array<{
      id: string;
      name: string;
      email: string;
      basic_salary: number;
      role: string;
    }> = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      employees.push({
        id: docSnapshot.id,
        name: data.name || "",
        email: data.email || "",
        basic_salary: data.basic_salary || 0,
        role: data.role || "employee",
      });
    });

    return employees;
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    throw new Error(error.message || "فشل في جلب بيانات الموظفين");
  }
};
