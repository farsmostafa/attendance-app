import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { User, FirebaseErrorType } from "../types";

const hydrateUserByUid = async (uid: string): Promise<User> => {
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  const employeeDocRef = doc(db, "employees", uid);
  const employeeDoc = await getDoc(employeeDocRef);
  const employeeData = employeeDoc.exists() ? employeeDoc.data() : {};

  const baseUser: User = userDoc.exists()
    ? ({
        uid,
        ...userDoc.data(),
        role: (userDoc.data().role || "employee") as User["role"],
      } as User)
    : { uid, role: "employee" };

  try {
    // Use object spread to merge entire employees document into users document
    // This ensures all fields (avatarUrl, phone, basicSalary, etc.) are globally available
    return {
      ...baseUser,
      ...employeeData,
      uid,
      role: (employeeData as any).role || baseUser.role || "employee",
      name: (employeeData as any).name || baseUser.name || "",
    } as User;
  } catch (error) {
    console.error("Failed to hydrate employee profile data:", error);
    return baseUser;
  }
};

export const signInAndBindDevice = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userData = await hydrateUserByUid(firebaseUser.uid);

    console.log("Login successful:", userData);
    return userData;
  } catch (error) {
    const firebaseError = error as FirebaseErrorType;
    if (
      firebaseError.code === "auth/wrong-password" ||
      firebaseError.code === "auth/user-not-found" ||
      firebaseError.code === "auth/invalid-credential"
    ) {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }
    throw new Error(firebaseError.message || "Failed to sign in");
  }
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getCurrentUserData = async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  return hydrateUserByUid(user.uid);
};
