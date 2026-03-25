'use client';

import { useState } from 'react';

export default function AssignmentDisplay({ assignment }) {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    explanation: true,
    requirements: true,
    starterCode: true,
    publicTests: true,
    hiddenTests: false,
    gradingRubric: false,
    validationRules: false,
  });

  const [copied, setCopied] = useState(false);

  if (!assignment) return null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'react':
        return 'bg-blue-500';
      case 'python':
        return 'bg-yellow-500';
      case 'sql':
        return 'bg-purple-500';
      case 'html_css':
        return 'bg-pink-500';
      case 'javascript':
        return 'bg-yellow-400';
      default:
        return 'bg-gray-500';
    }
  };

  const starterCode = assignment.starter_code || {};
  const hasStarterCode = Object.keys(starterCode).length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-pink-600 p-6 text-white relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{assignment.title || 'Assignment'}</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(assignment.assignment_type)}`}>
                {assignment.assignment_type?.toUpperCase() || 'N/A'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(assignment.difficulty)}`}>
                {assignment.difficulty?.toUpperCase() || 'N/A'}
              </span>
            </div>
            {assignment.id && (
              <p className="text-xs text-indigo-200 mt-3">Assignment ID: {assignment.id} | Class ID: {assignment.class_id}</p>
            )}
          </div>
          {assignment.description && (
            <button
              onClick={() => copyToClipboard(JSON.stringify(assignment, null, 2))}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              title="Copy assignment JSON"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Description Section */}
        <div className="border-l-4 border-blue-500 pl-4">
          <button
            onClick={() => toggleSection('description')}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Description
            </h3>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.description ? '−' : '+'}
            </span>
          </button>
          {expandedSections.description && (
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {assignment.description || 'No description provided.'}
            </div>
          )}
        </div>

        {/* Explanation Section */}
        {assignment.explanation && (
          <div className="border-l-4 border-emerald-500 pl-4">
            <button
              onClick={() => toggleSection('explanation')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                💡 Step-by-Step Explanation
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.explanation ? '−' : '+'}
              </span>
            </button>
            {expandedSections.explanation && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {assignment.explanation}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3 italic">
                  💡 Read this explanation to understand how to approach and solve this assignment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Requirements Section */}
        {assignment.requirements && assignment.requirements.length > 0 && (
          <div className="border-l-4 border-green-500 pl-4">
            <button
              onClick={() => toggleSection('requirements')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Requirements ({assignment.requirements.length})
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.requirements ? '−' : '+'}
              </span>
            </button>
            {expandedSections.requirements && (
              <div className="space-y-3">
                {assignment.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 flex-1">
                        {typeof req === 'string' ? req : JSON.stringify(req)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Starter Code Section */}
        {hasStarterCode && (
          <div className="border-l-4 border-purple-500 pl-4">
            <button
              onClick={() => toggleSection('starterCode')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Starter Code
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.starterCode ? '−' : '+'}
              </span>
            </button>
            {expandedSections.starterCode && (
              <div className="space-y-4">
                {starterCode.html && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">HTML</h4>
                    </div>
                    <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{starterCode.html}</code>
                    </pre>
                  </div>
                )}
                {starterCode.css && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">CSS</h4>
                    </div>
                    <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{starterCode.css}</code>
                    </pre>
                  </div>
                )}
                {starterCode.javascript && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">JavaScript</h4>
                    </div>
                    <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{starterCode.javascript}</code>
                    </pre>
                  </div>
                )}
                {starterCode.react && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">React</h4>
                    </div>
                    <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{starterCode.react}</code>
                    </pre>
                  </div>
                )}
                {starterCode.sql && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">SQL</h4>
                    </div>
                    <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{starterCode.sql}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Database Setup */}
        {assignment.db_setup && (
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Database Setup
            </h3>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                <code>{assignment.db_setup}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Public Tests Section */}
        {assignment.public_tests && assignment.public_tests.length > 0 && (
          <div className="border-l-4 border-teal-500 pl-4">
            <button
              onClick={() => toggleSection('publicTests')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Public Tests ({assignment.public_tests.length})
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.publicTests ? '−' : '+'}
              </span>
            </button>
            {expandedSections.publicTests && (
              <div className="space-y-4">
                {assignment.public_tests.map((test, index) => (
                  <div
                    key={index}
                    className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800"
                  >
                    <div className="flex items-start mb-2">
                      <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        {test.name && (
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {test.name}
                          </h4>
                        )}
                        {test.description && (
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {test.description}
                          </p>
                        )}
                        {test.code && (
                          <pre className="bg-gray-900 dark:bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mt-2">
                            <code>{test.code}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden Tests Section */}
        {assignment.hidden_tests && assignment.hidden_tests.length > 0 && (
          <div className="border-l-4 border-red-500 pl-4">
            <button
              onClick={() => toggleSection('hiddenTests')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Hidden Tests ({assignment.hidden_tests.length})
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.hiddenTests ? '−' : '+'}
              </span>
            </button>
            {expandedSections.hiddenTests && (
              <div className="space-y-4">
                {assignment.hidden_tests.map((test, index) => (
                  <div
                    key={index}
                    className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start mb-2">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        {test.name && (
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {test.name}
                          </h4>
                        )}
                        {test.description && (
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {test.description}
                          </p>
                        )}
                        {test.code && (
                          <pre className="bg-gray-900 dark:bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mt-2">
                            <code>{test.code}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grading Rubric Section */}
        {assignment.grading_rubric && Object.keys(assignment.grading_rubric).length > 0 && (
          <div className="border-l-4 border-indigo-500 pl-4">
            <button
              onClick={() => toggleSection('gradingRubric')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Grading Rubric
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.gradingRubric ? '−' : '+'}
              </span>
            </button>
            {expandedSections.gradingRubric && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(assignment.grading_rubric, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Validation Rules Section */}
        {assignment.validation_rules && Object.keys(assignment.validation_rules).length > 0 && (
          <div className="border-l-4 border-yellow-500 pl-4">
            <button
              onClick={() => toggleSection('validationRules')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Validation Rules
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.validationRules ? '−' : '+'}
              </span>
            </button>
            {expandedSections.validationRules && (
              <div className="space-y-3">
                {assignment.validation_rules.required_constructs && assignment.validation_rules.required_constructs.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                      Required Constructs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.validation_rules.required_constructs.map((construct, idx) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-xs">
                          {construct}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {assignment.validation_rules.forbidden_constructs && assignment.validation_rules.forbidden_constructs.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                      Forbidden Constructs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.validation_rules.forbidden_constructs.map((construct, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded text-xs">
                          {construct}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {assignment.validation_rules.required_patterns && assignment.validation_rules.required_patterns.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Required Patterns:
                    </h4>
                    <div className="space-y-2">
                      {assignment.validation_rules.required_patterns.map((pattern, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-mono text-blue-800 dark:text-blue-200">{pattern.pattern}</span>
                          {pattern.description && (
                            <span className="text-gray-600 dark:text-gray-400 ml-2">- {pattern.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {assignment.validation_rules.ast_checks && assignment.validation_rules.ast_checks.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      AST Checks:
                    </h4>
                    <div className="space-y-2">
                      {assignment.validation_rules.ast_checks.map((check, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-mono text-purple-800 dark:text-purple-200">{check.type}</span>
                          {check.name && (
                            <span className="text-gray-600 dark:text-gray-400 ml-2">.{check.name}</span>
                          )}
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${check.required ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            {check.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Changes Section */}
        {assignment.changes && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Changes / Modifications
            </h4>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              {assignment.changes}
            </p>
          </div>
        )}

        {/* Full JSON (Collapsible) */}
        <details className="border-t pt-4 mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            View Full JSON
          </summary>
          <pre className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(assignment, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

