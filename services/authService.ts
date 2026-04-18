import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { User, FirebaseErrorType } from "../types";

export const signInAndBindDevice = async (email: string, password: string): Promise<User> => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user role from Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    let userData: User = {
      uid: firebaseUser.uid,
      role: "employee", // Default role
    };

    if (userDoc.exists()) {
      const data = userDoc.data();
      userData = {
        uid: firebaseUser.uid,
        ...data,
        role: data.role || "employee",
      } as User;
    } else {
      console.warn("Warning: This user does not have a data file in Firestore.");
    }

    console.log("Login successful:", userData);
    return userData;
  } catch (error) {
    const firebaseError = error as FirebaseErrorType;
    // Handle common errors with user-friendly messages
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

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      uid: user.uid,
      ...data,
      role: data.role || "employee",
    } as User;
  } else {
    return {
      uid: user.uid,
      role: "employee",
    };
  }
};
