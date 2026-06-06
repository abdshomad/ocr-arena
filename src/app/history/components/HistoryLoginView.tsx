import React from "react";

interface HistoryLoginViewProps {
  tokenInput: string;
  setTokenInput: (t: string) => void;
  loginError: string;
  setLoginError: (e: string) => void;
  handleLogin: (e: React.FormEvent) => void;
}

export const HistoryLoginView: React.FC<HistoryLoginViewProps> = ({
  tokenInput,
  setTokenInput,
  loginError,
  setLoginError,
  handleLogin
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center shadow-[#0078d4]/5 dark:shadow-black/50">
        <div className="h-12 w-12 bg-[#0078d4] rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-[#0078d4]/20 mb-6 select-none">
          Ω
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 select-none">Access Token Required</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-6 select-none">
          Please enter the access token to view scan history.
        </p>
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter access token..."
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setLoginError("");
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-[#0078d4]/50 transition-colors"
              autoFocus
            />
            {loginError && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{loginError}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-md shadow-[#0078d4]/10 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};
