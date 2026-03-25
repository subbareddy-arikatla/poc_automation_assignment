"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { validateAssignmentCode } from "@/lib/api";
import ValidationResults from "./ValidationResults";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

export default function HtmlCssJsEditor({
  assignmentId,
  starterHtml = "<div>Hello World</div>",
  starterCss = "body { margin: 0; padding: 20px; }",
  starterJs = "console.log('Hello from JavaScript');",
  validationRules,
  onSubmit,
}) {
  const [html, setHtml] = useState(starterHtml);
  const [css, setCss] = useState(starterCss);
  const [js, setJs] = useState(starterJs);
  const [submitting, setSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const validationTimeoutRef = useRef(null);

  // Validate code when it changes (debounced)
  const validateCode = useCallback(async (htmlCode, cssCode, jsCode) => {
    if (!assignmentId || !validationRules || Object.keys(validationRules).length === 0) {
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(async () => {
      try {
        setValidating(true);
        const combinedCode = { html: htmlCode, css: cssCode, javascript: jsCode };
        const results = await validateAssignmentCode(assignmentId, combinedCode);
        setValidationResults(results.validation_results);
      } catch (err) {
        console.error("Validation error:", err);
        setValidationResults(null);
      } finally {
        setValidating(false);
      }
    }, 1000); // Debounce validation by 1 second
  }, [assignmentId, validationRules]);

  useEffect(() => {
    if ((html || css || js) && assignmentId && validationRules) {
      validateCode(html, css, js);
    }
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [html, css, js, assignmentId, validationRules, validateCode]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ html, css, javascript: js });
    } finally {
      setSubmitting(false);
    }
  };

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>`;

  return (
    <div className="space-y-4 min-h-[600px]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* HTML Editor */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              HTML
            </p>
          </div>
          <MonacoEditor
            height="300px"
            language="html"
            value={html}
            onChange={(value) => setHtml(value ?? "")}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </div>

        {/* CSS Editor */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              CSS
            </p>
          </div>
          <MonacoEditor
            height="300px"
            language="css"
            value={css}
            onChange={(value) => setCss(value ?? "")}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </div>

        {/* JavaScript Editor */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              JavaScript
            </p>
          </div>
          <MonacoEditor
            height="300px"
            language="javascript"
            value={js}
            onChange={(value) => setJs(value ?? "")}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Preview
          </p>
        </div>
        <iframe
          title="Preview"
          srcDoc={srcDoc}
          className="w-full h-[400px] border-0"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>

      {/* Validation Results */}
      {validationResults && (
        <ValidationResults
          validationResults={validationResults}
          validationRules={validationRules}
        />
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 items-center">
        {validating && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Validating...
          </span>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || validating}
          className="rounded-lg bg-blue-600 text-white px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting…" : "Submit Assignment"}
        </button>
      </div>
    </div>
  );
}

