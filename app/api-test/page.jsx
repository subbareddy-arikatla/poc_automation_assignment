'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getHealth,
  getAllBatches,
  getAllStudents,
  getClassesByBatch,
  getAssignmentDetail,
  getAllAssignments,
  submitAssignment,
  validateAssignmentCode,
  previewAssignment,
  saveAssignment,
  previewNote,
  saveNote,
  runCodeWithJudge0,
} from '@/lib/api';

const pretty = (value) => JSON.stringify(value, null, 2);

export default function ApiTestPage() {
  const [batchName, setBatchName] = useState('ASR2');
  const [classId, setClassId] = useState('1');
  const [studentEmail, setStudentEmail] = useState('');
  const [assignmentId, setAssignmentId] = useState('1');
  const [topic, setTopic] = useState('loops in python');
  const [runCode, setRunCode] = useState('print("hello from judge0")');
  const [noteChanges, setNoteChanges] = useState('');
  const [assignmentType, setAssignmentType] = useState('python');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [storedEmail, setStoredEmail] = useState('');

  const numericClassId = useMemo(() => Number(classId || 0), [classId]);
  const numericAssignmentId = useMemo(() => Number(assignmentId || 0), [assignmentId]);
  const resolvedEmail = (studentEmail || storedEmail || '').trim();

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('student_email') || '' : '';
    setStoredEmail(email);
  }, []);

  const handleRun = async (label, runner) => {
    setLoading(true);
    try {
      const data = await runner();
      setResult(`[PASS] ${label}\n\n${pretty(data)}`);
    } catch (err) {
      setResult(`[FAIL] ${label}\n\n${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">POC API Test Console</h1>
        <p className="text-sm text-gray-600">
          Run backend endpoints directly from the Next.js app and inspect response JSON.
        </p>

        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Batch Name (e.g. ASR2)"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Class ID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Assignment ID"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm md:col-span-2"
            placeholder="Student Email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <select
            className="rounded border px-3 py-2 text-sm"
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
          >
            <option value="python">python</option>
            <option value="react">react</option>
            <option value="sql">sql</option>
            <option value="html_css">html_css</option>
          </select>
          <input
            className="rounded border px-3 py-2 text-sm md:col-span-2"
            placeholder="Judge0 source code"
            value={runCode}
            onChange={(e) => setRunCode(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Note changes (optional)"
            value={noteChanges}
            onChange={(e) => setNoteChanges(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('GET /api/health/', () => getHealth())}>Health</button>
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('GET /api/batches/', () => getAllBatches())}>Batches</button>
          <button
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
            disabled={loading}
            onClick={() =>
              handleRun('GET /api/students/', async () => {
                const data = await getAllStudents();
                const rows = Array.isArray(data) ? data : data?.results || [];
                const emails = rows
                  .map((item) => item?.student_email || item?.email)
                  .filter(Boolean);
                return {
                  count: emails.length,
                  emails,
                };
              })
            }
          >
            List Student Emails
          </button>
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('GET /api/classes/mentor/classes/', () => getClassesByBatch(batchName))}>Classes By Batch</button>
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('GET /api/classes/assignments/detail/', () => getAssignmentDetail(numericClassId, resolvedEmail))}>Assignment Detail</button>
          <button
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
            disabled={loading || !resolvedEmail}
            onClick={() =>
              handleRun('GET /api/classes/assignments/', async () => {
                const data = await getAllAssignments(resolvedEmail);
                setAssignments(data?.results || []);
                return data;
              })
            }
          >
            List Assignments
          </button>

          <button className="rounded bg-indigo-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/assignments/submit/', () => submitAssignment({ class_id: numericClassId, assignment_id: numericAssignmentId, student_email: resolvedEmail, status: 'submitted', submitted_code: { code: 'print("hello")' } }))}>Submit Assignment</button>
          <button className="rounded bg-indigo-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/assignments/validate/', () => validateAssignmentCode(numericAssignmentId, 'print("hello")'))}>Validate Assignment</button>
          <button className="rounded bg-indigo-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/ai/preview-assignment/', () => previewAssignment({ class_id: numericClassId, topics: [topic], difficulty: 'medium', assignment_type: assignmentType, additional_information: 'generate short assignment' }))}>Preview Assignment</button>
          <button className="rounded bg-indigo-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/ai/save-assignment/', () => saveAssignment({ class_id: numericClassId, assignment: { title: 'Manual API Test Assignment', assignment_type: assignmentType, difficulty: 'easy', description: 'Created from API test page', requirements: ['Requirement 1'], starter_code: {}, public_tests: [], hidden_tests: [], grading_rubric: {} } }))}>Save Assignment</button>

          <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/ai/preview-note/', () => previewNote({ class_id: numericClassId, topic, additional_information: 'what is this topic?', changes: noteChanges || undefined }))}>Preview Note</button>
          <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/ai/save-note/', () => saveNote({ class_id: numericClassId, note: { topic, definition: 'Test definition', explanation: 'Test explanation', conclusion: 'Test conclusion', examples: [], code_examples: [], additional_information: '', changes: '' } }))}>Save Note</button>
          <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" disabled={loading} onClick={() => handleRun('POST /api/classes/assignments/run/', () => runCodeWithJudge0({ language: 'python', source_code: runCode || 'print("hello")' }))}>Run Judge0</button>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Assignments</p>
            <p className="text-xs text-gray-500">
              Use "List Assignments" to load. Click "Write Code" to open editor.
            </p>
          </div>

          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No assignments loaded yet.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((item) => (
                <div key={`${item.id}-${item.class_id}`} className="flex items-center justify-between rounded border p-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Assignment #{item.id}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span>Class #{item.class_id}</span>
                    {item.class_topic ? (
                      <>
                        <span className="mx-2 text-gray-400">|</span>
                        <span>{item.class_topic}</span>
                      </>
                    ) : null}
                  </div>
                  <Link
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    href={`/assignment/${item.class_id}?student_email=${encodeURIComponent(resolvedEmail)}`}
                  >
                    Write Code
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-black p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Result</p>
          <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words text-xs text-green-200">
            {result || 'Run an endpoint to see output here...'}
          </pre>
        </div>
      </div>
    </main>
  );
}

