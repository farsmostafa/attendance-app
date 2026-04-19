import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// مفاتيح الربط الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyAjG8i8CZOxyB5I18bsld3OG90kdiWOJNo",
  authDomain: "attendanceapp-saas.firebaseapp.com",
  projectId: "attendanceapp-saas",
  storageBucket: "attendanceapp-saas.firebasestorage.app",
  messagingSenderId: "841292143944",
  appId: "1:841292143944:web:ebebbc1428ddc7ceb0277d",
};

// تهيئة التطبيق الأساسي وقاعدة البيانات
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// تهيئة تطبيق ثانوي لعمليات إنشاء المستخدمين من قبل Admin
// بحيث لا يتم تسجيل الخروج للـ Admin الحالي
const secondaryApp = initializeApp(firebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);
