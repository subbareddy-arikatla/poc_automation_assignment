"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import initSqlJs from "sql.js";
import { validateAssignmentCode } from "@/lib/api";
import ValidationResults from "./ValidationResults";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

const SQL_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm";

const DEFAULT_DB_SETUP = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, customer_name TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);
INSERT INTO customers (id, customer_name) VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol');
INSERT INTO orders (id, customer_id, amount) VALUES (1, 1, 50.0), (2, 1, 30.0), (3, 2, 100.0), (4, 3, 25.0);
`;

export default function SqlEditor({
  assignmentId,
  dbSetup,
  starterQuery = "",
  validationRules,
  onSubmit,
}) {
  const [db, setDb] = useState(null);
  const [query, setQuery] = useState(starterQuery ?? "");
  const [loading, setLoading] = useState(true);
  const [runError, setRunError] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [queryHydrated, setQueryHydrated] = useState(false);
  const validationTimeoutRef = useRef(null);
  const dbRef = useRef(null);
  const draftStorageKey = `sql-editor-draft:${assignmentId ?? "unknown"}`;

  // Restore SQL draft from localStorage on mount / assignment change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDraft = window.localStorage.getItem(draftStorageKey);
    setQuery(savedDraft !== null ? savedDraft : starterQuery ?? "");
    setQueryHydrated(true);
  }, [draftStorageKey, starterQuery]);

  // Persist SQL draft on every change.
  useEffect(() => {
    if (!queryHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(draftStorageKey, query ?? "");
  }, [query, queryHydrated, draftStorageKey]);

  useEffect(() => {
    let cancelled = false;

    initSqlJs({
      locateFile: () => SQL_WASM_CDN,
    })
      .then((SQL) => {
        if (cancelled) return;
        let database = new SQL.Database();
        const setup = (dbSetup || "").trim() || DEFAULT_DB_SETUP;
        try {
          database.run(setup);
        } catch (e) {
          console.warn("dbSetup error:", e);
          database.close();
          database = new SQL.Database();
          try {
            database.run(DEFAULT_DB_SETUP);
          } catch (e2) {
            console.warn("default dbSetup error:", e2);
          }
        }
        if (dbRef.current) {
          try {
            dbRef.current.close();
          } catch {}
        }
        dbRef.current = database;
        setDb(database);
      })
      .catch((e) => {
        if (!cancelled)
          setRunError(e.message || "Failed to load SQL environment");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (dbRef.current) {
        try {
          dbRef.current.close();
        } catch {}
        dbRef.current = null;
      }
    };
  }, [dbSetup]);

  const handleRun = useCallback(() => {
    if (!db) return;
    if (!String(query || "").trim()) {
      setRunError("Please enter a SQL query before running.");
      setRunResult(null);
      return;
    }
    setRunError(null);
    setRunResult(null);
    try {
      const stmt = db.exec(query);
      setRunResult(stmt);
    } catch (e) {
      setRunError(e.message || "Query error");
    }
  }, [db, query]);

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
    if (query && assignmentId && validationRules) {
      validateCode(query);
    }
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [query, assignmentId, validationRules, validateCode]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ code: query });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Loading SQL environment…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[500px]">
      {/* SQL Editor */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            SQL Query
          </p>
        </div>
        <MonacoEditor
          height="300px"
          language="sql"
          value={query}
          onChange={(value) => setQuery(value ?? "")}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Validation Results */}
      {validationResults && (
        <ValidationResults
          validationResults={validationResults}
          validationRules={validationRules}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={handleRun}
          disabled={!db}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Run Query
        </button>
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

      {/* Error Display */}
      {runError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{runError}</p>
        </div>
      )}

      {/* Results Table */}
      {runResult && runResult.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Query Results
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {runResult[0]?.columns?.map((col, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runResult[0]?.values?.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {(Array.isArray(row) ? row : []).map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-2 text-gray-900 dark:text-gray-100"
                    >
                      {String(cell ?? "NULL")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

