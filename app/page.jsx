import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            POC Assignment Automation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Code editor platform for assignments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              HTML/CSS/JavaScript
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Monaco Editor with live preview in iframe sandbox
            </p>
            <Link
              href="/assignment/1?type=html_css"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try HTML/CSS Editor →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              SQL Editor
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Monaco SQL Editor with sql.js for query execution
            </p>
            <Link
              href="/assignment/1?type=sql"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try SQL Editor →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              React Editor
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Esbuild-wasm for bundling React components with live preview
            </p>
            <Link
              href="/assignment/1?type=react"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try React Editor →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Classes & AI Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create classes, generate assignments and notes using AI
            </p>
            <Link
              href="/classes"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Classes →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              API Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect to Django backend API for assignment management
            </p>
            <Link
              href="/api/health"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Check API Status →
            </Link>
            <div className="mt-3">
              <Link
                href="/api-test"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open API Test Console →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Getting Started
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To use an assignment editor, navigate to{" "}
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              /assignment/[id]
            </code>{" "}
            where [id] is the assignment ID from the backend API.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Make sure the Django backend is running on{" "}
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              http://localhost:8000
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

