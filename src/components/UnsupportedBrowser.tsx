export function UnsupportedBrowser() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Browser Not Supported
          </h2>

          <p className="text-slate-600 mb-6">
            VetTriage requires the Web Speech API for voice transcription, which
            isn&apos;t available in your current browser.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-700 font-medium mb-4">
              Please open VetTriage in one of these browsers:
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  C
                </span>
                <span className="text-slate-700">
                  Google Chrome (recommended)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  E
                </span>
                <span className="text-slate-700">Microsoft Edge</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  S
                </span>
                <span className="text-slate-700">Safari (iOS 14.5+)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
