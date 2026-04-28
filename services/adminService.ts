import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseApiKey } from "../firebaseConfig";

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

export interface Department {
  id: string;
  name: string;
  subDepartments: string[];
}

export const addEmployee = async (companyId: string, employeeData: any): Promise<string> => {
  try {
    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: employeeData.email,
        password: employeeData.password,
        returnSecureToken: true,
      }),
    });
    const authData = await authResponse.json();
    if (!authResponse.ok) {
      throw new Error(authData.error?.message || "Failed to create auth account");
    }
    const newUid = authData.localId;

    if (!newUid) {
      throw new Error("Failed to create auth user");
    }

    const userPayload = {
      email: employeeData.email,
      name: employeeData.name,
      role: employeeData.role,
      companyId,
      department: employeeData.department,
      status: "active",
      createdAt: serverTimestamp(),
    };

    const employeePayload = {
      ...userPayload,
      uid: newUid,
      phone: employeeData.phone || "",
      basicSalary: employeeData.basicSalary ?? employeeData.salary ?? employeeData.basic_salary ?? 0,
      checkInTime: employeeData.checkInTime || "09:00",
      checkOutTime: employeeData.checkOutTime || "17:00",
      avatarUrl: employeeData.avatarUrl || null,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", newUid), userPayload);
    await setDoc(doc(db, "employees", newUid), employeePayload);
    return newUid;
  } catch (error: any) {
    console.error("Error adding employee:", error);
    const customError: any = new Error(error?.message || "Failed to add employee");
    customError.code = error?.code || error?.message;
    throw customError;
  }
};

/**
 * Create a new employee user and link Firestore docs to the same UID
 */
export const createNewEmployee = async (
  employeeData: NewEmployeeData,
  adminCompanyId: string,
): Promise<{ uid: string; message: string }> => {
  try {
    const uid = await addEmployee(adminCompanyId, {
      name: employeeData.name,
      email: employeeData.email,
      password: employeeData.password,
      phone: employeeData.phone,
      department: employeeData.department,
      role: employeeData.role,
      basicSalary: employeeData.basicSalary || employeeData.basic_salary || 0,
      checkInTime: employeeData.workStartTime || "09:00",
      checkOutTime: "17:00",
      status: employeeData.status || "active",
    });

    return {
      uid,
      message: `Employee ${employeeData.name} created successfully`,
    };
  } catch (error: any) {
    console.error("Error creating employee:", error);

    let message = error.message || "Failed to create employee";
    if (error.code === "EMAIL_EXISTS" || error.code === "auth/email-already-in-use") {
      message = "Email already exists";
    } else if (error.code === "WEAK_PASSWORD : Password should be at least 6 characters" || error.code === "auth/weak-password") {
      message = "Weak password (must be at least 6 characters)";
    } else if (error.code === "INVALID_EMAIL" || error.code === "auth/invalid-email") {
      message = "Invalid email address";
    }

    const customError: any = new Error(message);
    customError.code = error.code;
    throw customError;
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
    phone: string;
    department: string;
    basicSalary: number;
    status: string;
    role: "admin" | "employee";
    avatarUrl?: string | null;
  }>
> => {
  try {
    const q = query(collection(db, "employees"), where("companyId", "==", companyId), where("role", "==", "employee"));

    const querySnapshot = await getDocs(q);
    const employees: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      department: string;
      basicSalary: number;
      status: string;
      joinDate: string;
      role: "admin" | "employee";
      avatarUrl?: string | null;
    }> = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      employees.push({
        id: docSnapshot.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        department: data.department || "Other",
        basicSalary: data.basicSalary || 0,
        status: data.status || "active",
        joinDate: data.joinDate || data.join_date || "Unknown",
        role: data.role === "admin" ? "admin" : "employee",
        avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
      });
    });

    return employees;
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    throw new Error(error.message || "Failed to fetch employees");
  }
};

/**
 * Fetch departments for a specific company
 */
export const fetchDepartments = async (companyId: string): Promise<Department[]> => {
  try {
    const departmentsQuery = query(collection(db, "departments"), where("companyId", "==", companyId));
    const querySnapshot = await getDocs(departmentsQuery);

    const departments: Department[] = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as { name?: string; subDepartments?: string[] };
      return {
        id: docSnapshot.id,
        name: data.name || "",
        subDepartments: Array.isArray(data.subDepartments) ? data.subDepartments : [],
      };
    });

    return departments.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    throw new Error(error.message || "Failed to fetch departments");
  }
};

/**
 * Seed default departments once for a company when empty
 */
export const seedDepartmentsIfEmpty = async (
  companyId: string,
): Promise<{ seeded: boolean; count: number }> => {
  try {
    const departmentsQuery = query(collection(db, "departments"), where("companyId", "==", companyId));
    const existingDepartments = await getDocs(departmentsQuery);

    if (!existingDepartments.empty) {
      return { seeded: false, count: 0 };
    }

    const now = new Date().toISOString();
    const seedData: Array<{ name: string; subDepartments: string[] }> = [
      { name: "IT", subDepartments: ["Frontend", "Backend"] },
      { name: "HR", subDepartments: [] },
      { name: "Sales", subDepartments: [] },
    ];

    await Promise.all(
      seedData.map((department) =>
        addDoc(collection(db, "departments"), {
          ...department,
          companyId,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );

    return { seeded: true, count: seedData.length };
  } catch (error: any) {
    console.error("Error seeding departments:", error);
    throw new Error(error.message || "Failed to seed departments");
  }
};

