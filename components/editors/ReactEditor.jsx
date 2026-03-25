"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import * as esbuild from "esbuild-wasm";
import { validateAssignmentCode } from "@/lib/api";
import ValidationResults from "./ValidationResults";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

const REACT_EDITOR_MODEL_PATH = "App.tsx";

/** Without a `.tsx` path, Monaco parses `<` as operators; enable JSX like a TSX file. */
function configureMonacoForReactEditor(monaco) {
  const compilerOptions = {
    jsx: monaco.languages.typescript.JsxEmit.React,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
    strictNullChecks: false,
    noEmit: true,
  };
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    compilerOptions
  );
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    ...compilerOptions,
    checkJs: false,
  });
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    "declare const React: any;\n",
    "file:///react-global-shim.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
declare module "react" {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const Fragment: any;
}
declare module "react-dom" {
  const ReactDOM: any;
  export default ReactDOM;
}
declare module "react-dom/client" {
  export function createRoot(container: any): { render: (node: any) => void };
}
`,
    "file:///react-module-shim.d.ts"
  );
}

// esbuild-wasm allows only one `initialize()` per page (library global). Fast Refresh
// can reload this module and reset a file-level promise while esbuild stays initialized.
// Store the init promise on globalThis so every copy of this module shares the same init.
const ESBUILD_INIT_PROMISE_KEY = "__poc_automation_esbuild_wasm_init__";

// wasmURL must match the installed `esbuild-wasm` package version (see package.json).
const ESBUILD_WASM_URL =
  "https://unpkg.com/esbuild-wasm@0.27.4/esbuild.wasm";

function isEsbuildDuplicateInitError(err) {
  const msg = String(err?.message ?? err);
  return msg.includes("initialize") && msg.includes("more than once");
}

function ensureEsbuildInitialized() {
  const g = globalThis;
  if (g[ESBUILD_INIT_PROMISE_KEY]) return g[ESBUILD_INIT_PROMISE_KEY];

  let p;
  try {
    p = esbuild.initialize({ wasmURL: ESBUILD_WASM_URL });
  } catch (err) {
    if (isEsbuildDuplicateInitError(err)) {
      p = Promise.resolve();
    } else {
      throw err;
    }
  }

  g[ESBUILD_INIT_PROMISE_KEY] = p.catch((err) => {
    if (isEsbuildDuplicateInitError(err)) return;
    delete g[ESBUILD_INIT_PROMISE_KEY];
    throw err;
  });
  return g[ESBUILD_INIT_PROMISE_KEY];
}

function buildPreviewSrcDoc(scriptBody, revision = 0) {
  if (!scriptBody) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:20px;font-family:system-ui,sans-serif;color:#64748b">Preview updates while you type, or click <strong>Run preview</strong>.</body></html>`;
  }
  const safe = scriptBody.replace(/<\/script>/gi, "<\\/script>");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light">
  <style>
    html, body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111827; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__PREVIEW_REVISION__ = ${revision};
  </script>
  <script>${safe}</script>
</body>
</html>`;
}

// Injected only for bundling when the editor is empty (still need a default export App).
const EMPTY_EDITOR_BUNDLE_STUB = "export default function App() { return null; }";

const REACT_ESM = "https://esm.sh/react@18";
const REACT_DOM_ESM = "https://esm.sh/react-dom@18";

/** Bare `react` + `https://` imports: WASM has no fs; URLs must use a namespace + onLoad fetch. */
const HTTP_URL_NS = "http-url";

const esmHttpAndReactShimPlugin = {
  name: "poc-esm-http-react-shim",
  setup(build) {
    const toHttp = (path) => ({ path, namespace: HTTP_URL_NS });

    build.onResolve({ filter: /^react$/ }, () => toHttp(REACT_ESM));
    build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
      path: `${REACT_ESM}/jsx-runtime`,
      namespace: HTTP_URL_NS,
    }));
    build.onResolve({ filter: /^react\/jsx-dev-runtime$/ }, () => ({
      path: `${REACT_ESM}/jsx-dev-runtime`,
      namespace: HTTP_URL_NS,
    }));
    build.onResolve({ filter: /^react-dom$/ }, () => toHttp(REACT_DOM_ESM));
    build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
      path: `${REACT_DOM_ESM}/client`,
      namespace: HTTP_URL_NS,
    }));

    build.onResolve({ filter: /^https?:\/\// }, (args) => toHttp(args.path));

    build.onResolve({ filter: /.*/, namespace: HTTP_URL_NS }, (args) => ({
      path: new URL(args.path, args.importer).href,
      namespace: HTTP_URL_NS,
    }));

    build.onLoad({ filter: /.*/, namespace: HTTP_URL_NS }, async (args) => {
      const res = await fetch(args.path);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${args.path}`);
      }
      const contents = await res.text();
      return { contents, loader: "js" };
    });
  },
};

function normalizeUserSource(source) {
  const raw = String(source ?? "");
  const trimmed = raw.trim();

  if (!trimmed) return EMPTY_EDITOR_BUNDLE_STUB;

  // If user already wrote a full App default component/module, keep as-is.
  if (/export\s+default\s+function\s+App\b/.test(trimmed)) return raw;
  if (/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)\b/.test(trimmed)) {
    return raw.replace(
      /export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)\s*\(/,
      "function App("
    );
  }
  const exportDefaultIdentifier = trimmed.match(
    /export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*;?/
  );
  if (exportDefaultIdentifier?.[1]) {
    return raw.replace(
      /export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*;?/,
      "const App = $1;"
    );
  }
  if (/export\s+default\b/.test(trimmed)) return raw;
  if (/function\s+App\s*\(/.test(trimmed)) return `${raw}\n\nexport default App;`;
  if (/const\s+App\s*=/.test(trimmed) || /let\s+App\s*=/.test(trimmed)) {
    return `${raw}\n\nexport default App;`;
  }

  // If user wrote another component name (e.g. Counter), export it as default.
  const functionComponentMatch = trimmed.match(
    /\bfunction\s+([A-Z][A-Za-z0-9_]*)\s*\(/
  );
  if (functionComponentMatch?.[1]) {
    return `${raw}\n\nexport default ${functionComponentMatch[1]};`;
  }

  const constComponentMatch = trimmed.match(
    /\b(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:\([^)]*\)\s*=>|function\b)/
  );
  if (constComponentMatch?.[1]) {
    return `${raw}\n\nexport default ${constComponentMatch[1]};`;
  }

  // Don't wrap if there are top-level imports/exports; that would make invalid syntax.
  if (/^\s*(import|export)\s/m.test(trimmed)) {
    return raw;
  }

  // Otherwise treat it as JSX snippet and auto-wrap for easier student input.
  return `export default function App() {
  return (
    <>
${raw}
    </>
  );
}`;
}

export default function ReactEditor({
  assignmentId,
  starterCode = "",
  validationRules,
  onSubmit,
}) {
  const [code, setCode] = useState(starterCode ?? "");
  const [bundledCode, setBundledCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [esbuildReady, setEsbuildReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [codeHydrated, setCodeHydrated] = useState(false);
  const validationTimeoutRef = useRef(null);
  const draftStorageKey = useMemo(
    () => `react-editor-draft:${assignmentId ?? "unknown"}`,
    [assignmentId]
  );

  // Restore editor draft from localStorage on mount / assignment change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDraft = window.localStorage.getItem(draftStorageKey);
    if (savedDraft !== null) {
      setCode(savedDraft);
    } else {
      setCode(starterCode ?? "");
    }
    setCodeHydrated(true);
  }, [draftStorageKey, starterCode]);

  // Persist draft to localStorage whenever code changes.
  useEffect(() => {
    if (!codeHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(draftStorageKey, code ?? "");
  }, [code, codeHydrated, draftStorageKey]);

  // Initialize esbuild-wasm (single global init across remounts / Strict Mode)
  useEffect(() => {
    let cancelled = false;
    ensureEsbuildInitialized()
      .then(() => {
        if (!cancelled) {
          setEsbuildReady(true);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(`Failed to initialize esbuild: ${err.message}`);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runBundle = useCallback(
    async (source, showBusy) => {
      if (!esbuildReady) return;
      if (showBusy) setPreviewBusy(true);
      try {
        setError(null);
        await ensureEsbuildInitialized();
        const bundleInput = normalizeUserSource(source);
        const result = await esbuild.build({
          stdin: {
            contents: `
import React from '${REACT_ESM}';
import ReactDOM from '${REACT_DOM_ESM}/client';

${bundleInput}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
`,
            loader: "tsx",
          },
          plugins: [esmHttpAndReactShimPlugin],
          bundle: true,
          format: "iife",
          write: false,
          target: "es2020",
        });

        if (result.outputFiles && result.outputFiles.length > 0) {
          setBundledCode(result.outputFiles[0].text);
          setPreviewRevision((prev) => prev + 1);
        }
      } catch (err) {
        setError(err.message || "Bundle error");
        setBundledCode("");
      } finally {
        if (showBusy) setPreviewBusy(false);
      }
    },
    [esbuildReady]
  );

  // Auto bundle on change (debounced)
  useEffect(() => {
    if (!esbuildReady) return;
    const timeoutId = setTimeout(() => {
      void runBundle(code, false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [code, esbuildReady, runBundle]);

  const previewSrcDoc = useMemo(
    () => buildPreviewSrcDoc(bundledCode, previewRevision),
    [bundledCode, previewRevision]
  );

  // Validate code when it changes (debounced)
  const validateCode = useCallback(async (codeToValidate) => {
    if (!assignmentId || !validationRules || Object.keys(validationRules).length === 0) {
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(async () => {
      try {
        setValidating(true);
        const results = await validateAssignmentCode(assignmentId, codeToValidate);
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
    if (code && assignmentId && validationRules) {
      validateCode(code);
    }
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [code, assignmentId, validationRules, validateCode]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ code });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Initializing React environment…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[600px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* React Code Editor */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              React Code (JSX)
            </p>
          </div>
          <MonacoEditor
            height="500px"
            language="typescript"
            path={REACT_EDITOR_MODEL_PATH}
            beforeMount={configureMonacoForReactEditor}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Preview
            </p>
            <button
              type="button"
              onClick={() => void runBundle(code, true)}
              disabled={previewBusy}
              className="text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2.5 py-1 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {previewBusy ? "Bundling…" : "Run preview"}
            </button>
          </div>
          <iframe
            title="React Preview"
            srcDoc={previewSrcDoc}
            className="w-full h-[500px] border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <ValidationResults
          validationResults={validationResults}
          validationRules={validationRules}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        {validating && (
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
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

