import React from "react";
import Layout from "../components/Layout";

// Dummy data for demonstration
const dummyStudent = {
  name: "John Doe",
  rollNo: 5,
  position: 3,
  className: "Class A",
  nextTerm: "10/10/2025",
  attendance: { present: 48, total: 50 },
  interests: "Football, Reading",
  attitude: "Good",
  classTeacherComments: "Shows consistent effort",
  headmaster: "Mr. Kwame",
  subjects: [
    { name: "English", cscore: 45, exam: 78 },
    { name: "Mathematics", cscore: 50, exam: 88 },
    { name: "Science", cscore: 40, exam: 60 },
  ],
};

const IndividualReportPage = () => {
  const student = dummyStudent;

  // Calculate total marks per subject
  const subjectsWithTotal = student.subjects.map((sub) => {
    const total = ((sub.cscore / 60) * 50) + ((sub.exam / 100) * 50);
    return { ...sub, total };
  });

  const grandTotal = subjectsWithTotal.reduce((acc, sub) => acc + sub.total, 0);

  return (
    <Layout>
      <div className="p-4">
        {/* Main heading */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase">Ghana Education Service</h1>
          <h1 className="text-xl font-bold uppercase">Wenchi</h1>
          <h1 className="text-xl font-bold uppercase">DERIAD'S eSBA</h1>
          <h1 className="text-lg font-bold uppercase">End of Third Term Report</h1>
        </div>

        {/* Student details */}
        <div className="flex justify-between mb-2">
          <div>NAME: {student.name}</div>
          <div>NO. ROLL: {student.rollNo} POS: {student.position}</div>
        </div>
        <div className="flex justify-between mb-4">
          <div>CLASS: {student.className}</div>
          <div>NEXT TERM BEGINS: {student.nextTerm}</div>
        </div>

        {/* Marks table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1">SUBJECT</th>
                <th className="border px-2 py-1">C.SCORE</th>
                <th className="border px-2 py-1">EXAM</th>
                <th className="border px-2 py-1">TOTAL</th>
                <th className="border px-2 py-1">POS</th>
                <th className="border px-2 py-1">REM.</th>
              </tr>
            </thead>
            <tbody>
              {subjectsWithTotal.map((sub, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-2 py-1">{sub.name}</td>
                  <td className="border px-2 py-1">{sub.cscore}</td>
                  <td className="border px-2 py-1">{sub.exam}</td>
                  <td className="border px-2 py-1">{sub.total.toFixed(2)}</td>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    {sub.total >= 70
                      ? "Excellent"
                      : sub.total >= 60
                      ? "Very Good"
                      : sub.total >= 50
                      ? "Good"
                      : sub.total >= 40
                      ? "Fair"
                      : "Poor"}
                  </td>
                </tr>
              ))}

              {/* Grand Total */}
              <tr className="font-bold text-center">
                <td className="border px-2 py-1" colSpan={3}>
                  G. TOTAL
                </td>
                <td className="border px-2 py-1">{grandTotal.toFixed(2)}</td>
                <td className="border px-2 py-1">-</td>
                <td className="border px-2 py-1">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer section */}
        <div className="mt-4">
          <p>ATTENDANCE: {student.attendance.present} OUT OF {student.attendance.total}</p>
          <p>INTEREST: {student.interests}</p>
          <p>ATTITUDE: {student.attitude}</p>
          <p>CLASS TEACHER’S REM.: {student.classTeacherComments}</p>
          <p>HEADMASTER’S SIGNATURE: {student.headmaster}</p>
        </div>

        {/* Print button */}
        <div className="mt-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print Report
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default IndividualReportPage;
