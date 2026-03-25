"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AssignmentEditor from "@/components/editors/AssignmentEditor";
import { getAssignmentDetail, submitAssignment } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");

  // Get classId and studentEmail from URL params or localStorage
  const classId = params?.id ? Number(params.id) : null;
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const emailFromQuery =
      searchParams?.get("student_email") ||
      searchParams?.get("email") ||
      "";
    const emailFromStorage = localStorage.getItem("student_email") || "";
    const resolvedEmail = (emailFromQuery || emailFromStorage).trim();

    if (resolvedEmail) {
      localStorage.setItem("student_email", resolvedEmail);
      setStudentEmail(resolvedEmail);
      setEmailInput(resolvedEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!classId) {
      setError("Class ID is required in URL (/assignment/{classId}).");
      setLoading(false);
      return;
    }

    if (!studentEmail) {
      setLoading(false);
      return;
    }

    // Fetch assignment details
    const fetchAssignment = async () => {
      try {
        // Note: You may need to adjust this based on your actual API structure
        // This is a placeholder - you'll need to implement the actual API call
        const data = await getAssignmentDetail(classId, studentEmail);
        
        // Transform API response to Assignment format
        // Adjust this based on your actual API response structure
        setAssignment({
          id: data.id,
          assignment_type: data.assignment_type || "html_css",
          title: data.title || "Assignment",
          description: data.description || "",
          requirements: data.requirements || [],
          starter_code: data.starter_code || {},
          db_setup: data.db_setup,
          difficulty: data.difficulty || "medium",
          validation_rules: data.validation_rules || {},
        });
      } catch (err) {
        const message = String(err?.message || "");
        if (message.includes("Class not found") || message.includes("DailyClass")) {
          setError(`Class not found for id ${classId}.`);
        } else if (message.includes("404")) {
          setError("No assignment found for this class and student yet.");
        } else {
          setError(message || "Failed to load assignment");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [classId, studentEmail]);

  const handleSubmit = async (submissionData) => {
    try {
      await submitAssignment(submissionData);
      alert("Assignment submitted successfully!");
      router.push("/");
    } catch (err) {
      alert(`Failed to submit: ${err.message}`);
    }
  };

  const handleSetEmail = () => {
    const normalized = String(emailInput || "").trim();
    if (!normalized) {
      setError("Please enter student email");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("student_email", normalized);
    }
    setError(null);
    setLoading(true);
    setStudentEmail(normalized);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading assignment...</p>
      </div>
    );
  }

  if (!studentEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center w-full max-w-md px-4">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Student email is required to open assignment.
          </p>
          <input
            type="email"
            placeholder="Enter student email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
          />
          <button
            onClick={handleSetEmail}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Assignment not found"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Assignment Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {assignment.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {assignment.description}
          </p>
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              {assignment.assignment_type}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm">
              {assignment.difficulty}
            </span>
          </div>
          {assignment.requirements.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Requirements:
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                {assignment.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <AssignmentEditor
            assignment={assignment}
            classId={classId}
            studentEmail={studentEmail}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

