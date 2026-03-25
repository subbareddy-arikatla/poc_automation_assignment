const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

async function api(method: string, path: string, body: unknown = null) {
  const url = API_BASE.replace(/\/$/, "") + path;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `API ${method} ${path}: ${res.status}`;
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (error: unknown) {
    // Handle network errors (CORS, connection refused, etc.)
    const e = error as { name?: string; message?: string };
    if (e.name === 'TypeError' && String(e.message || '').includes('fetch')) {
      throw new Error(
        `Failed to connect to backend API at ${url}. ` +
        `Please ensure the Django server is running on ${API_BASE} and CORS is properly configured.`
      );
    }
    throw error;
  }
}

export interface Assignment {
  id?: number;
  assignment_type: "html_css" | "sql" | "react" | "python" | "javascript";
  title: string;
  description: string;
  requirements: string[];
  starter_code: {
    html?: string;
    css?: string;
    javascript?: string;
    react?: string;
    sql?: string;
  };
  db_setup?: string;
  difficulty: string;
  validation_rules?: {
    required_constructs?: string[];
    forbidden_constructs?: string[];
    required_patterns?: Array<{ pattern: string; description: string }>;
    ast_checks?: Array<{ type: string; name: string; required: boolean }>;
  };
}

export interface AssignmentSubmission {
  class_id: number;
  assignment_id?: number;
  student_email: string;
  status?: string;
  submitted_code: {
    code?: string;
    html?: string;
    css?: string;
    javascript?: string;
    react?: string;
    sql?: string;
  };
}

export interface ValidationResults {
  passed: boolean;
  errors: Array<{ rule: string; message: string; line: number }>;
  warnings: Array<{ rule: string; message: string; line: number }>;
  checks: {
    required_constructs?: { found: string[]; missing: string[] };
    forbidden_constructs?: { found: string[] };
  };
  score: number;
}

export function getHealth() {
  return api("GET", "/api/health/");
}

export function getAssignmentDetail(classId: number, studentEmail: string) {
  const safeEmail = encodeURIComponent((studentEmail || "").trim());
  return api(
    "GET",
    `/api/classes/assignments/detail/?class_id=${classId}&student_email=${safeEmail}`
  );
}

export function getAllAssignments(studentEmail: string) {
  const safeEmail = encodeURIComponent((studentEmail || "").trim());
  return api("GET", `/api/classes/assignments/?student_email=${safeEmail}`);
}

export function submitAssignment(data: AssignmentSubmission) {
  return api("POST", "/api/classes/assignments/submit/", data);
}

export function generateAssignment(body: {
  class_id: number;
  topics: string[];
  difficulty: string;
  assignment_type: string;
  sub_topic?: string;
  additional_information?: string;
}) {
  return api("POST", "/api/classes/ai/generate-assignment/", body);
}

export function validateAssignmentCode(assignmentId: number, code: string | object) {
  return api("POST", "/api/classes/assignments/validate/", {
    assignment_id: assignmentId,
    code: code,
  });
}

// Classes API
export function getClassesByBatch(batchName: string, date?: string, excludeDeleted: boolean = true) {
  const params = new URLSearchParams({
    batchName,
    excludeDeleted: excludeDeleted.toString(),
  });
  if (date) params.append("date", date);
  return api("GET", `/api/classes/mentor/classes/?${params.toString()}`);
}

export function getAllBatches() {
  return api("GET", "/api/batches/");
}

export function getAllStudents() {
  return api("GET", "/api/students/");
}

export interface CreateClassPayload {
  batch_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  topic: string;
  lecture?: string;
  instructorName: string;
  sessionType: string;
  classDriveLink?: string;
  modeOfClasses: string;
  isReqiredAttendance?: boolean;
  is_deleted?: boolean;
  createdOn: number; // epoch millis
  classCreatedBy?: Record<string, unknown>;
  deleteInfo?: Record<string, unknown>;
  noteLink?: string;
  assignmentLink?: string;
  prevTime?: string | null;
}

export function createClass(data: CreateClassPayload) {
  return api("POST", "/api/classes/mentor/classes/create/", data);
}

// Assignment Preview & Save API
export function previewAssignment(data: {
  class_id: number;
  topics: string[];
  difficulty: string;
  assignment_type: string;
  sub_topic?: string;
  additional_information?: string;
  changes?: string;
}) {
  return api("POST", "/api/classes/ai/preview-assignment/", data);
}

export function saveAssignment(data: {
  class_id: number;
  assignment: Record<string, unknown>;
}) {
  return api("POST", "/api/classes/ai/save-assignment/", data);
}

// Notes API - Preview & Save
export function previewNote(data: {
  class_id: number;
  topic: string;
  sub_topic?: string;
  additional_information?: string;
  changes?: string;
}) {
  return api("POST", "/api/classes/ai/preview-note/", data);
}

export function saveNote(data: {
  class_id: number;
  note: Record<string, unknown>;
}) {
  return api("POST", "/api/classes/ai/save-note/", data);
}

// Legacy function for backward compatibility (deprecated)
export function generateNote(data: {
  class_id: number;
  topic: string;
  sub_topic?: string;
  additional_information?: string;
  changes?: string;
}) {
  return previewNote(data);
}

export function runCodeWithJudge0(data: {
  language: "python" | "javascript" | "java";
  source_code: string;
  stdin?: string;
}) {
  return api("POST", "/api/classes/assignments/run/", data);
}

