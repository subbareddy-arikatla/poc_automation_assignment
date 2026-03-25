'use client';

import { useState } from 'react';

export default function NoteDisplay({ note }) {
  const [expandedSections, setExpandedSections] = useState({
    definition: true,
    explanation: true,
    examples: true,
    codeExamples: true,
    advantages: true,
    disadvantages: true,
    conclusion: true,
  });

  const [copied, setCopied] = useState(false);

  if (!note) return null;

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{note.topic || 'Note Topic'}</h2>
            {note.sub_topic && (
              <p className="text-blue-100 text-lg">Sub-topic: {note.sub_topic}</p>
            )}
            {note.additional_information && (
              <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-blue-200 font-semibold mb-1">📋 Topics Covered:</p>
                <p className="text-blue-100 text-sm">{note.additional_information}</p>
              </div>
            )}
            {note.id && (
              <p className="text-xs text-blue-200 mt-2">Note ID: {note.id} | Class ID: {note.class_id}</p>
            )}
          </div>
          {note.full_content && (
            <button
              onClick={() => copyToClipboard(note.full_content)}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              title="Copy full content"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Definition Section - only show if provided */}
        {note.definition && note.definition.trim() && (
          <div className="border-l-4 border-blue-500 pl-4">
            <button
              onClick={() => toggleSection('definition')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Definition
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.definition ? '−' : '+'}
              </span>
            </button>
            {expandedSections.definition && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {note.definition}
              </p>
            )}
          </div>
        )}

        {/* Explanation Section */}
        <div className="border-l-4 border-green-500 pl-4">
          <button
            onClick={() => toggleSection('explanation')}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Detailed Explanation
            </h3>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.explanation ? '−' : '+'}
            </span>
          </button>
          {expandedSections.explanation && (
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {note.explanation || 'No explanation provided.'}
            </div>
          )}
        </div>

        {/* Examples Section */}
        {note.examples && note.examples.length > 0 && (
          <div className="border-l-4 border-yellow-500 pl-4">
            <button
              onClick={() => toggleSection('examples')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Examples ({note.examples.length})
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.examples ? '−' : '+'}
              </span>
            </button>
            {expandedSections.examples && (
              <div className="space-y-4">
                {note.examples.map((example, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-start">
                      <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 flex-1">
                        {typeof example === 'string' ? example : example.description || example.title || JSON.stringify(example)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Code Examples Section */}
        {note.code_examples && note.code_examples.length > 0 && (
          <div className="border-l-4 border-purple-500 pl-4">
            <button
              onClick={() => toggleSection('codeExamples')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Code Examples ({note.code_examples.length})
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.codeExamples ? '−' : '+'}
              </span>
            </button>
            {expandedSections.codeExamples && (
              <div className="space-y-6">
                {note.code_examples.map((codeEx, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <div className="bg-purple-500 text-white px-4 py-2">
                      <h4 className="font-semibold">
                        {codeEx.title || `Code Example ${index + 1}`}
                      </h4>
                    </div>
                    <div className="p-4">
                      <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        <code>{codeEx.code || 'No code provided'}</code>
                      </pre>
                      {codeEx.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Explanation:</strong> {codeEx.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conclusion Section - only show if provided */}
        {note.conclusion && note.conclusion.trim() && (
          <div className="border-l-4 border-indigo-500 pl-4">
            <button
              onClick={() => toggleSection('conclusion')}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Conclusion
              </h3>
              <span className="text-gray-500 dark:text-gray-400">
                {expandedSections.conclusion ? '−' : '+'}
              </span>
            </button>
            {expandedSections.conclusion && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {note.conclusion}
              </p>
            )}
          </div>
        )}

        {/* Additional Information */}
        {note.additional_information && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Additional Information
            </h4>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              {note.additional_information}
            </p>
          </div>
        )}

        {/* Full Content (Collapsible) */}
        {note.full_content && (
          <details className="border-t pt-4 mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              View Full Markdown Content
            </summary>
            <pre className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {note.full_content}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

