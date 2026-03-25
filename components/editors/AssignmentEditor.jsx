"use client";

import HtmlCssJsEditor from "./HtmlCssJsEditor";
import SqlEditor from "./SqlEditor";
import ReactEditor from "./ReactEditor";

export default function AssignmentEditor({
  assignment,
  classId,
  studentEmail,
  onSubmit,
}) {
  const handleSubmit = async (data) => {
    let submissionData = {
      class_id: classId,
      assignment_id: assignment.id,
      student_email: studentEmail,
      status: "submitted",
      submitted_code: {},
    };

    // Format submission based on assignment type
    switch (assignment.assignment_type) {
      case "html_css":
      case "javascript":
        submissionData.submitted_code = {
          html: data.html || "",
          css: data.css || "",
          javascript: data.javascript || "",
        };
        break;
      case "sql":
        submissionData.submitted_code = {
          code: data.code || "",
          sql: data.code || "",
        };
        break;
      case "react":
        submissionData.submitted_code = {
          code: data.code || "",
          react: data.code || "",
        };
        break;
    }

    await onSubmit(submissionData);
  };

  // Render appropriate editor based on assignment type
  switch (assignment.assignment_type) {
    case "html_css":
      return (
        <HtmlCssJsEditor
          assignmentId={assignment.id}
          starterHtml={assignment.starter_code?.html}
          starterCss={assignment.starter_code?.css}
          starterJs={assignment.starter_code?.javascript}
          validationRules={assignment.validation_rules}
          onSubmit={async (data) => {
            await handleSubmit(data);
          }}
        />
      );

    case "javascript":
      return (
        <HtmlCssJsEditor
          assignmentId={assignment.id}
          starterHtml="<div id='app'></div>"
          starterCss="body { margin: 0; padding: 20px; }"
          starterJs={assignment.starter_code?.javascript || ""}
          validationRules={assignment.validation_rules}
          onSubmit={async (data) => {
            await handleSubmit(data);
          }}
        />
      );

    case "sql":
      return (
        <SqlEditor
          assignmentId={assignment.id}
          dbSetup={assignment.db_setup}
          starterQuery={assignment.starter_code?.sql}
          validationRules={assignment.validation_rules}
          onSubmit={async (data) => {
            await handleSubmit(data);
          }}
        />
      );

    case "react":
      return (
        <ReactEditor
          assignmentId={assignment.id}
          starterCode={assignment.starter_code?.react}
          validationRules={assignment.validation_rules}
          onSubmit={async (data) => {
            await handleSubmit(data);
          }}
        />
      );

    default:
      return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">
            Unsupported assignment type: {assignment.assignment_type}
          </p>
        </div>
      );
  }
}

