"use client";

export default function ValidationResults({ validationResults, validationRules }) {
  if (!validationResults || Object.keys(validationResults).length === 0) {
    return null;
  }

  const { passed, errors, warnings, checks, score } = validationResults;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div
        className={`rounded-lg border p-4 ${
          passed
            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
            : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Code Validation
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                passed
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
              }`}
            >
              {passed ? "✓ Passed" : "✗ Failed"}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Score: {score.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
              Errors ({errors.length}):
            </h4>
            <ul className="space-y-1">
              {errors.map((error, idx) => (
                <li
                  key={idx}
                  className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
                >
                  <span className="text-red-500">●</span>
                  <span>
                    <span className="font-medium">{error.rule}:</span>{" "}
                    {error.message}
                    {error.line > 0 && (
                      <span className="text-gray-500"> (Line {error.line})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-2">
              Warnings ({warnings.length}):
            </h4>
            <ul className="space-y-1">
              {warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2"
                >
                  <span className="text-yellow-500">⚠</span>
                  <span>
                    <span className="font-medium">{warning.rule}:</span>{" "}
                    {warning.message}
                    {warning.line > 0 && (
                      <span className="text-gray-500"> (Line {warning.line})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Checks Summary */}
        {checks && Object.keys(checks).length > 0 && (
          <div className="mt-3 space-y-2">
            {checks.required_constructs && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Required Constructs:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {checks.required_constructs.found?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs"
                    >
                      ✓ {item}
                    </span>
                  ))}
                  {checks.required_constructs.missing?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                    >
                      ✗ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {checks.forbidden_constructs &&
              checks.forbidden_constructs.found?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    Forbidden Constructs Found:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {checks.forbidden_constructs.found.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                      >
                        ✗ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Validation Rules Info */}
      {validationRules && Object.keys(validationRules).length > 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
          <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
            Validation Rules:
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {validationRules.required_constructs &&
              validationRules.required_constructs.length > 0 && (
                <div>
                  <span className="font-medium">Required:</span>{" "}
                  {validationRules.required_constructs.join(", ")}
                </div>
              )}
            {validationRules.forbidden_constructs &&
              validationRules.forbidden_constructs.length > 0 && (
                <div>
                  <span className="font-medium">Forbidden:</span>{" "}
                  {validationRules.forbidden_constructs.join(", ")}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

