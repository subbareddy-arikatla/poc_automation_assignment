'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import {
  getClassesByBatch,
  getAllBatches,
  previewAssignment,
  saveAssignment,
  previewNote,
  saveNote,
  createClass,
} from '@/lib/api';
import { useToast, Toast } from '@/components/ui/Toast';
import NoteDisplay from '@/components/ui/NoteDisplay';
import AssignmentDisplay from '@/components/ui/AssignmentDisplay';

const selectStyles = {
  control: (baseStyles) => ({
    ...baseStyles,
    border: '0',
    boxShadow: 'none',
    borderRadius: '16px',
    paddingBlock: '4px',
    width: '100%',
    '&:hover': {
      borderColor: 'none',
    },
  }),
};

export default function ClassesPage() {
  const { toast, showSuccessToast, showErrorToast, showWarningToast } = useToast();

  // Create class state
  const [createClassBatch, setCreateClassBatch] = useState(null);
  const [createClassDate, setCreateClassDate] = useState(new Date());
  const [createClassForm, setCreateClassForm] = useState({
    time: '09:00:00',
    endTime: '10:30:00',
    topic: '',
    lecture: '',
    instructorName: '',
    sessionType: 'live-session',
    classDriveLink: '',
    modeOfClasses: 'Online',
    isReqiredAttendance: true,
    noteLink: '',
    assignmentLink: '',
  });
  const [creatingClass, setCreatingClass] = useState(false);

  // Batch & class fetching state
  const [batchOptions, setBatchOptions] = useState([]);
  const [aiBatch, setAiBatch] = useState(null);
  const [aiDate, setAiDate] = useState(new Date());
  const [aiClasses, setAiClasses] = useState([]);
  const [aiLoadingClasses, setAiLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Assignment state
  const [assignmentForm, setAssignmentForm] = useState({
    topics: '',
    difficulty: 'medium',
    assignment_type: 'react',
    sub_topic: '',
    additional_information: '',
    changes: '',
  });
  const [assignmentPreview, setAssignmentPreview] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);

  // Note state
  const [noteForm, setNoteForm] = useState({
    topic: '',
    sub_topic: '',
    additional_information: '',
    changes: '',
  });
  const [notePreview, setNotePreview] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // Load batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await getAllBatches();
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          setBatchOptions(
            list.map((b) => ({
              label: b.batch_name || b.name || String(b),
              value: b.batch_name || b.name || String(b),
            }))
          );
        } else {
          showWarningToast('No batches found. Please create a batch first.');
        }
      } catch (err) {
        console.error('Failed to load batches', err);
        const errorMsg = err?.message || 'Failed to load batches';
        showErrorToast(errorMsg);
      }
    };
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateClassChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateClassForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateClass = async () => {
    if (!createClassBatch) {
      showWarningToast('Please select a batch for creating class');
      return;
    }
    if (!createClassForm.topic.trim()) {
      showWarningToast('Please enter class topic');
      return;
    }
    if (!createClassForm.instructorName.trim()) {
      showWarningToast('Please enter instructor name');
      return;
    }

    setCreatingClass(true);
    try {
      const payload = {
        batch_name: createClassBatch.value,
        date: dayjs(createClassDate).format('YYYY-MM-DD'),
        time: createClassForm.time || '09:00:00',
        endTime: createClassForm.endTime || '10:30:00',
        topic: createClassForm.topic,
        lecture: createClassForm.lecture || '',
        instructorName: createClassForm.instructorName,
        sessionType: createClassForm.sessionType,
        classDriveLink: createClassForm.classDriveLink || '',
        modeOfClasses: createClassForm.modeOfClasses,
        isReqiredAttendance: createClassForm.isReqiredAttendance,
        is_deleted: false,
        createdOn: Date.now(),
        classCreatedBy: {},
        deleteInfo: {},
        noteLink: createClassForm.noteLink || '',
        assignmentLink: createClassForm.assignmentLink || '',
        prevTime: null,
      };

      const response = await createClass(payload);
      if (response?.success) {
        showSuccessToast('Class created successfully!');
        setCreateClassForm((prev) => ({
          ...prev,
          topic: '',
          lecture: '',
          classDriveLink: '',
          noteLink: '',
          assignmentLink: '',
        }));
      } else {
        showErrorToast('Failed to create class');
      }
    } catch (err) {
      console.error('Error creating class:', err);
      const msg = err?.message || 'Failed to create class';
      showErrorToast(msg);
    } finally {
      setCreatingClass(false);
    }
  };

  // Fetch classes for AI tools
  const fetchAIClasses = async () => {
    if (!aiBatch || !aiDate) {
      showWarningToast('Please select batch and date for AI tools');
      return;
    }
    setAiLoadingClasses(true);
    setSelectedClassId(null);
    setSelectedClass(null);
    setAiClasses([]);
    setAssignmentPreview(null);
    setNotePreview(null);
    try {
      const isoDate = dayjs(aiDate).format('YYYY-MM-DD');
      const data = await getClassesByBatch(aiBatch.value, isoDate, false);
      const list = Array.isArray(data) ? data : [];
      setAiClasses(list);
      if (!list.length) {
        showWarningToast('No classes found for selected batch and date');
      } else {
        showSuccessToast(`Found ${list.length} class(es)`);
      }
    } catch (err) {
      console.error('Error fetching classes for AI tools:', err);
      showErrorToast('Failed to fetch classes for AI tools');
    } finally {
      setAiLoadingClasses(false);
    }
  };

  const handleSelectAIClass = (e) => {
    const value = e.target.value;
    const classId = value ? Number(value) : null;
    setSelectedClassId(classId);
    const cls = aiClasses.find((c) => c.id === classId);
    setSelectedClass(cls);
    setAssignmentPreview(null);
    setNotePreview(null);
    
    // Auto-populate forms with class data
    if (cls) {
      // Populate assignment form with class topic and lecture (as subtopic)
      setAssignmentForm((prev) => ({
        ...prev,
        topics: cls.topic || '',
        sub_topic: cls.lecture || '',
      }));
      
      // Populate note form with class topic and lecture (as subtopic)
      setNoteForm((prev) => ({
        ...prev,
        topic: cls.topic || '',
        sub_topic: cls.lecture || '',
      }));
    } else {
      // Clear forms if no class selected
      setAssignmentForm((prev) => ({
        ...prev,
        topics: '',
        sub_topic: '',
      }));
      setNoteForm((prev) => ({
        ...prev,
        topic: '',
        sub_topic: '',
      }));
    }
  };

  // Assignment handlers
  const handleAssignmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreviewAssignment = async () => {
    if (!selectedClassId) {
      showWarningToast('Please select a class for assignment generation');
      return;
    }
    if (!assignmentForm.topics.trim()) {
      showWarningToast('Please enter topics for the assignment');
      return;
    }

    setAssignmentLoading(true);
    setAssignmentPreview(null);
    try {
      const payload = {
        class_id: selectedClassId,
        topics: assignmentForm.topics.split(',').map((t) => t.trim()).filter(Boolean),
        difficulty: assignmentForm.difficulty,
        assignment_type: assignmentForm.assignment_type,
        sub_topic: assignmentForm.sub_topic || undefined,
        additional_information: assignmentForm.additional_information || undefined,
        changes: assignmentForm.changes || undefined,
      };
      const response = await previewAssignment(payload);
      if (response?.success) {
        setAssignmentPreview(response.preview);
        showSuccessToast('Assignment preview generated successfully!');
      } else {
        showErrorToast('Failed to generate assignment preview');
      }
    } catch (err) {
      console.error('Error previewing assignment:', err);
      const msg = err?.message || 'Failed to generate assignment preview';
      showErrorToast(msg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedClassId || !assignmentPreview) {
      showWarningToast('No preview to save. Generate an assignment preview first.');
      return;
    }
    setAssignmentSaving(true);
    try {
      const payload = {
        class_id: selectedClassId,
        assignment: assignmentPreview,
      };
      const response = await saveAssignment(payload);
      if (response?.success) {
        showSuccessToast(`Assignment saved successfully! ID: ${response.id}`);
        setAssignmentPreview(null);
        setAssignmentForm({
          topics: '',
          difficulty: 'medium',
          assignment_type: 'react',
          sub_topic: '',
          additional_information: '',
          changes: '',
        });
      } else {
        showErrorToast('Failed to save assignment');
      }
    } catch (err) {
      console.error('Error saving assignment:', err);
      const msg = err?.message || 'Failed to save assignment';
      showErrorToast(msg);
    } finally {
      setAssignmentSaving(false);
    }
  };

  // Note handlers
  const handleNoteFormChange = (e) => {
    const { name, value } = e.target;
    setNoteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreviewNote = async () => {
    if (!selectedClassId) {
      showWarningToast('Please select a class for note generation');
      return;
    }
    if (!noteForm.topic.trim()) {
      showWarningToast('Please enter a note topic');
      return;
    }

    setNoteLoading(true);
    setNotePreview(null);
    try {
      const payload = {
        class_id: selectedClassId,
        topic: noteForm.topic,
        sub_topic: noteForm.sub_topic || undefined,
        additional_information: noteForm.additional_information || undefined,
        changes: noteForm.changes || undefined,
      };
      const response = await previewNote(payload);
      if (response?.success) {
        setNotePreview(response.preview);
        showSuccessToast('Note preview generated successfully!');
      } else {
        showErrorToast('Failed to generate note preview');
      }
    } catch (err) {
      console.error('Error generating note preview:', err);
      const msg = err?.message || 'Failed to generate note preview';
      showErrorToast(msg);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedClassId || !notePreview) {
      showWarningToast('Please generate a note preview first');
      return;
    }

    setNoteSaving(true);
    try {
      const payload = {
        class_id: selectedClassId,
        note: notePreview,
      };
      const response = await saveNote(payload);
      if (response?.success) {
        showSuccessToast(`Note saved successfully! (ID: ${response.id})`);
        // Optionally clear the preview or keep it
        // setNotePreview(null);
      } else {
        showErrorToast('Failed to save note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      const msg = err?.message || 'Failed to save note';
      showErrorToast(msg);
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Toast toast={toast} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Classes & AI Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate assignments and notes for your classes using AI
          </p>
        </div>

        {/* Create Class */}
        <div className="bg-white dark:bg-gray-800 border shadow rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Create Class
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="focus-within:border-orange-500 border rounded-2xl border-gray-300 dark:border-gray-600">
              <Select
                instanceId="create-class-batch-select"
                options={batchOptions}
                value={createClassBatch}
                onChange={setCreateClassBatch}
                isSearchable
                placeholder="Select Batch"
                styles={selectStyles}
                className="text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center border rounded-2xl px-3 border-gray-300 dark:border-gray-600 focus-within:border-orange-500">
              <DatePicker
                selected={createClassDate}
                onChange={(date) => setCreateClassDate(date)}
                className="w-full focus:outline-none bg-transparent text-gray-900 dark:text-white"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="time"
                type="time"
                value={createClassForm.time}
                onChange={handleCreateClassChange}
                className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
              <input
                name="endTime"
                type="time"
                value={createClassForm.endTime}
                onChange={handleCreateClassChange}
                className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              name="topic"
              placeholder="Topic"
              value={createClassForm.topic}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <input
              name="lecture"
              placeholder="Lecture (optional)"
              value={createClassForm.lecture}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              name="instructorName"
              placeholder="Instructor Name"
              value={createClassForm.instructorName}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <select
              name="sessionType"
              value={createClassForm.sessionType}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="live-session">Live Session</option>
              <option value="lab-session">Lab Session</option>
              <option value="recorded-session">Recorded Session</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              name="classDriveLink"
              placeholder="Class Drive Link (optional)"
              value={createClassForm.classDriveLink}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <select
              name="modeOfClasses"
              value={createClassForm.modeOfClasses}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              name="noteLink"
              placeholder="Note Link (optional)"
              value={createClassForm.noteLink}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <input
              name="assignmentLink"
              placeholder="Assignment Link (optional)"
              value={createClassForm.assignmentLink}
              onChange={handleCreateClassChange}
              className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="isReqiredAttendance"
                checked={createClassForm.isReqiredAttendance}
                onChange={handleCreateClassChange}
                className="rounded"
              />
              Required Attendance
            </label>
            <button
              type="button"
              onClick={handleCreateClass}
              disabled={creatingClass}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl py-2 px-6 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {creatingClass ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </div>

        {/* Batch + Date + Load Classes */}
        <div className="bg-white dark:bg-gray-800 border shadow rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Step 1: Select Batch & Date
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="focus-within:border-orange-500 border rounded-2xl border-gray-300 dark:border-gray-600">
              <Select
                instanceId="ai-batch-select"
                options={batchOptions}
                value={aiBatch}
                onChange={setAiBatch}
                isSearchable
                placeholder="Select Batch"
                styles={selectStyles}
                className="text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center border rounded-2xl px-3 border-gray-300 dark:border-gray-600 focus-within:border-orange-500">
              <DatePicker
                selected={aiDate}
                onChange={(date) => setAiDate(date)}
                className="w-full focus:outline-none bg-transparent text-gray-900 dark:text-white"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
              />
            </div>
            <button
              type="button"
              onClick={fetchAIClasses}
              disabled={aiLoadingClasses}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 px-4 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {aiLoadingClasses ? 'Loading Classes...' : 'Load Classes'}
            </button>
          </div>

          {/* Class selection */}
          {aiClasses.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Step 2: Select Class
              </label>
              <select
                className="w-full border rounded-2xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-orange-500"
                value={selectedClassId || ''}
                onChange={handleSelectAIClass}
              >
                <option value="">Select a class...</option>
                {aiClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.date} {cls.time} - {cls.topic}
                  </option>
                ))}
              </select>
              {selectedClass && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Selected Class Details:
                  </p>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Topic:</strong> {selectedClass.topic || 'N/A'}</p>
                    {selectedClass.lecture && (
                      <p><strong>Lecture/Sub-topic:</strong> {selectedClass.lecture}</p>
                    )}
                    <p><strong>Date & Time:</strong> {selectedClass.date} {selectedClass.time}</p>
                    {selectedClass.instructorName && (
                      <p><strong>Instructor:</strong> {selectedClass.instructorName}</p>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    ✓ Topic and lecture have been auto-filled in the forms below
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Tools: Assignment + Notes */}
        {selectedClassId && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment column */}
            <div className="bg-white dark:bg-gray-800 border shadow rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Generate Assignment (Preview → Save)
              </h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topics {selectedClass && <span className="text-blue-600 dark:text-blue-400">(from class)</span>}
                  </label>
                  <textarea
                    name="topics"
                    placeholder="Topics (comma separated, e.g. React, Hooks, State Management)"
                    value={assignmentForm.topics}
                    onChange={handleAssignmentFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="difficulty"
                    value={assignmentForm.difficulty}
                    onChange={handleAssignmentFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select
                    name="assignment_type"
                    value={assignmentForm.assignment_type}
                    onChange={handleAssignmentFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    <option value="react">React</option>
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                    <option value="html_css">HTML/CSS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub-topic {selectedClass?.lecture && <span className="text-blue-600 dark:text-blue-400">(from class lecture)</span>}
                  </label>
                  <input
                    name="sub_topic"
                    placeholder="Sub-topic (optional, e.g. useState and useEffect)"
                    value={assignmentForm.sub_topic}
                    onChange={handleAssignmentFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <input
                  name="additional_information"
                  placeholder="Additional information (optional)"
                  value={assignmentForm.additional_information}
                  onChange={handleAssignmentFormChange}
                  className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
                <textarea
                  name="changes"
                  placeholder="Changes / modifications (optional, for regenerate)"
                  value={assignmentForm.changes}
                  onChange={handleAssignmentFormChange}
                  className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  rows="2"
                />
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handlePreviewAssignment}
                    disabled={assignmentLoading}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl py-3 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {assignmentLoading ? 'Generating...' : 'Preview Assignment'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignment}
                    disabled={!assignmentPreview || assignmentSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-2xl py-3 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {assignmentSaving ? 'Saving...' : 'Save Assignment'}
                  </button>
                </div>
              </div>
            </div>

            {/* Notes column */}
            <div className="bg-white dark:bg-gray-800 border shadow rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Generate Notes</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic {selectedClass && <span className="text-blue-600 dark:text-blue-400">(from class)</span>}
                  </label>
                  <input
                    name="topic"
                    placeholder="Note topic (e.g. React Hooks)"
                    value={noteForm.topic}
                    onChange={handleNoteFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub-topic {selectedClass?.lecture && <span className="text-blue-600 dark:text-blue-400">(from class lecture)</span>}
                  </label>
                  <input
                    name="sub_topic"
                    placeholder="Sub-topic (optional, e.g. useState and useEffect)"
                    value={noteForm.sub_topic}
                    onChange={handleNoteFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Topics/Information
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">(separate multiple topics with commas)</span>
                  </label>
                  <textarea
                    name="additional_information"
                    placeholder="e.g., loops and types of loops and for loop while loop, OR introduction of python, history of python, why should we learn python"
                    value={noteForm.additional_information}
                    onChange={handleNoteFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 w-full"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Tip: You can add multiple topics separated by commas. Each topic will be covered in detail.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Changes / Modifications
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">(will be strictly applied)</span>
                  </label>
                  <textarea
                    name="changes"
                    placeholder="e.g., make explanation more focused on beginners, add more code examples, emphasize practical applications"
                    value={noteForm.changes}
                    onChange={handleNoteFormChange}
                    className="border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 w-full"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Tip: Be specific about what changes you want. All changes will be strictly followed.
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handlePreviewNote}
                    disabled={noteLoading}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl py-3 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {noteLoading ? 'Generating...' : 'Preview Note'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={!notePreview || noteSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-2xl py-3 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {noteSaving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Assignment Display (shown below the form columns) */}
          {assignmentPreview && (
            <div className="mt-6">
              <AssignmentDisplay assignment={assignmentPreview} />
            </div>
          )}

          {/* Full Note Display (shown below the form columns) */}
          {notePreview && (
            <div className="mt-6">
              <NoteDisplay note={notePreview} />
            </div>
          )}
          </>
        )}

        {!selectedClassId && aiClasses.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Please select a class above to generate assignments or notes.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

