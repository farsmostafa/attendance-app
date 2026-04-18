import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export const calculateNetSalary = async (userId: string, baseSalary: number): Promise<number> => {
  const finQuery = query(collection(db, "financial_records"), where("user_id", "==", userId));
  const finSnapshot = await getDocs(finQuery);
  let totalBonus = 0;
  let totalDeduction = 0;
  finSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === "bonus") totalBonus += data.amount;
    else if (data.type === "deduction") totalDeduction += data.amount;
  });
  return baseSalary + totalBonus - totalDeduction;
};
