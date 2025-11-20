import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getStudent, getStudentReportData, getFormMasterRemarks } from "../api-client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNotification } from "../context/NotificationContext";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import { DEFAULT_TERM } from "../constants/terms";

const IndividualReportPage = () => {
  const { studentId } = useParams();
  const { showNotification } = useNotification();
  const { settings } = useGlobalSettings();

  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [remarks, setRemarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;

      setLoading(true);
      try {
        // Fetch student details
        const studentResponse = await getStudent(studentId);
        if (studentResponse.status === 'success') {
          setStudent(studentResponse.data);
        } else {
          throw new Error(studentResponse.message || "Failed to load student details");
        }

        // Fetch marks
        const currentTerm = settings.term || DEFAULT_TERM;
        const marksResponse = await getStudentReportData(studentId, currentTerm);

        if (marksResponse.status === 'success') {
          setMarks(marksResponse.data || []);
        }

        // Fetch remarks
        if (studentResponse.data && studentResponse.data.className) {
          const remarksResponse = await getFormMasterRemarks(
            studentId,
            studentResponse.data.className,
            currentTerm
          );
          if (remarksResponse.status === 'success' && remarksResponse.data) {
            // If array, take first item, otherwise use object
            const remarkData = Array.isArray(remarksResponse.data)
              ? remarksResponse.data[0]
              : remarksResponse.data;
            setRemarks(remarkData);
          }
        }

      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err.message);
        showNotification({
          type: "error",
          message: "Failed to load report data"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, settings.term, showNotification]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner message="Loading report..." />
        </div>
      </Layout>
    );
  }

  if (error || !student) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-600">
          <h2 className="text-xl font-bold">Error Loading Report</h2>
          <p>{error || "Student not found"}</p>
        </div>
      </Layout>
    );
  }

  // Calculate totals
  const subjectsWithTotal = marks.map((mark) => {
    // Ensure numeric values
    const classScore = parseFloat(mark.class_score || mark.classScore || 0);
    const examScore = parseFloat(mark.exam_score || mark.examScore || 0);
    const total = parseFloat(mark.total || (classScore + examScore));

    return {
      name: mark.subject,
      cscore: classScore,
      exam: examScore,
      total: total,
      position: mark.position || "-",
      remark: mark.remark || "-"
    };
  });

  const grandTotal = subjectsWithTotal.reduce((acc, sub) => acc + sub.total, 0);
  const average = subjectsWithTotal.length > 0 ? grandTotal / subjectsWithTotal.length : 0;

  return (
    <Layout>
      <div className="p-4 max-w-4xl mx-auto bg-white min-h-screen">
        {/* Main heading */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase">Ghana Education Service</h1>
          <h2 className="text-xl font-bold uppercase">Wenchi</h2>
          <h2 className="text-xl font-bold uppercase text-blue-900">DERIAD'S eSBA</h2>
          <h3 className="text-lg font-bold uppercase mt-2">End of {settings.term || DEFAULT_TERM} Report</h3>
        </div>

        {/* Student details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium border p-4 rounded bg-gray-50">
          <div>
            <span className="font-bold text-gray-600">NAME:</span> {student.firstName} {student.lastName}
          </div>
          <div>
            <span className="font-bold text-gray-600">ID NUMBER:</span> {student.idNumber}
          </div>
          <div>
            <span className="font-bold text-gray-600">CLASS:</span> {student.className}
          </div>
          <div>
            <span className="font-bold text-gray-600">GENDER:</span> {student.gender}
          </div>
          <div>
            <span className="font-bold text-gray-600">ACADEMIC YEAR:</span> {student.academicYear || new Date().getFullYear()}
          </div>
          <div>
            {/* Position could be calculated or fetched if available */}
          </div>
        </div>

        {/* Marks table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border border-black text-sm">
            <thead className="bg-gray-200 font-bold">
              <tr>
                <th className="border border-black px-2 py-2 text-left">SUBJECT</th>
                <th className="border border-black px-2 py-2 text-center w-20">C.SCORE (50)</th>
                <th className="border border-black px-2 py-2 text-center w-20">EXAM (50)</th>
                <th className="border border-black px-2 py-2 text-center w-20">TOTAL (100)</th>
                <th className="border border-black px-2 py-2 text-center w-16">POS</th>
                <th className="border border-black px-2 py-2 text-left w-32">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {subjectsWithTotal.length > 0 ? (
                subjectsWithTotal.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-black px-2 py-2 font-medium">{sub.name}</td>
                    <td className="border border-black px-2 py-2 text-center">{sub.cscore.toFixed(1)}</td>
                    <td className="border border-black px-2 py-2 text-center">{sub.exam.toFixed(1)}</td>
                    <td className="border border-black px-2 py-2 text-center font-bold">{sub.total.toFixed(1)}</td>
                    <td className="border border-black px-2 py-2 text-center">{sub.position}</td>
                    <td className="border border-black px-2 py-2 text-xs">{sub.remark}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border border-black px-4 py-8 text-center text-gray-500 italic">
                    No marks recorded for this term yet.
                  </td>
                </tr>
              )}

              {/* Grand Total */}
              <tr className="font-bold bg-gray-100">
                <td className="border border-black px-2 py-2 text-right" colSpan={3}>
                  GRAND TOTAL
                </td>
                <td className="border border-black px-2 py-2 text-center">{grandTotal.toFixed(1)}</td>
                <td className="border border-black px-2 py-2" colSpan={2}>
                  AVG: {average.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer section / Remarks */}
        <div className="mt-6 border border-black p-4 rounded bg-white">
          <h3 className="font-bold border-b border-gray-300 mb-3 pb-1">PERFORMANCE SUMMARY</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold text-xs text-gray-600">ATTENDANCE</span>
                <span>{remarks?.attendance || "-"} / {remarks?.attendanceTotal || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold text-xs text-gray-600">INTEREST</span>
                <span>{remarks?.interest || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                <span className="font-bold text-xs text-gray-600">ATTITUDE</span>
                <span>{remarks?.attitude || "-"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-bold text-xs text-gray-600 mb-1">CLASS TEACHER'S REMARKS:</p>
                <p className="border-b border-dotted border-gray-400 pb-1 min-h-[1.5rem] italic">
                  {remarks?.remarks || remarks?.comments || "No remarks yet."}
                </p>
              </div>
              <div>
                <p className="font-bold text-xs text-gray-600 mb-1">HEADMASTER'S SIGNATURE:</p>
                <div className="h-12 border-b border-dotted border-black"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Print button - Hide when printing */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Official Report
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default IndividualReportPage;
