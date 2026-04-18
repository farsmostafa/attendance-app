import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

interface Props {
  employeeId: string;
}

const EmployeeDetails: React.FC<Props> = ({ employeeId }) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [salary, setSalary] = useState(0);
  const [bonus, setBonus] = useState("");
  const [deduction, setDeduction] = useState("");
  const [netSalary, setNetSalary] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch attendance
      const attQuery = query(collection(db, "attendance"), where("user_id", "==", employeeId));
      const attSnapshot = await getDocs(attQuery);
      const attList: any[] = [];
      attSnapshot.forEach((doc) => attList.push(doc.data()));
      setAttendance(attList);

      // Fetch salary from users
      const userQuery = query(collection(db, "users"), where("id", "==", employeeId));
      const userSnapshot = await getDocs(userQuery);
      setSalary(userSnapshot.docs[0].data().base_salary || 0);

      // Calculate net salary
      calculateNetSalary(attList, userSnapshot.docs[0].data().base_salary || 0);
    };

    fetchData();
  }, [employeeId]);

  const calculateNetSalary = async (att: any[], base: number) => {
    // Fetch financial records
    const finQuery = query(collection(db, "financial_records"), where("user_id", "==", employeeId));
    const finSnapshot = await getDocs(finQuery);
    let totalBonus = 0;
    let totalDeduction = 0;
    finSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === "bonus") totalBonus += data.amount;
      else if (data.type === "deduction") totalDeduction += data.amount;
    });
    setNetSalary(base + totalBonus - totalDeduction);
  };

  const addRecord = async (type: "bonus" | "deduction") => {
    const amount = parseFloat(type === "bonus" ? bonus : deduction);
    if (isNaN(amount)) {
      console.log("Invalid amount");
      return;
    }

    await addDoc(collection(db, "financial_records"), {
      user_id: employeeId,
      type,
      amount,
      date: new Date(),
    });
    console.log("Added successfully");
    // Recalculate
    calculateNetSalary(attendance, salary);
  };

  const totalHours = attendance.reduce(
    (sum, att) => sum + (att.check_out ? (new Date(att.check_out).getTime() - new Date(att.check_in).getTime()) / 3600000 : 0),
    0,
  );
  const delays = attendance.filter((att) => new Date(att.check_in).getHours() > 9).length; // Assuming 9 AM start

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Details</Text>
      <Text>Total Hours: {totalHours.toFixed(2)}</Text>
      <Text>Delays: {delays}</Text>
      <Text>Base Salary: {salary}</Text>
      <Text>Net Salary: {netSalary}</Text>

      <TextInput placeholder="Bonus Amount" value={bonus} onChangeText={setBonus} keyboardType="numeric" />
      <Button title="Add Bonus" onPress={() => addRecord("bonus")} />

      <TextInput placeholder="Deduction Amount" value={deduction} onChangeText={setDeduction} keyboardType="numeric" />
      <Button title="Add Deduction" onPress={() => addRecord("deduction")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});

export default EmployeeDetails;
