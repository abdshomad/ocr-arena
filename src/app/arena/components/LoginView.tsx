import React from "react";

interface LoginViewProps {
  tokenInput: string;
  setTokenInput: (val: string) => void;
  loginError: string;
  setLoginError: (val: string) => void;
  setIsAuthenticated: (val: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  tokenInput,
  setTokenInput,
  loginError,
  setLoginError,
  setIsAuthenticated
}) => {
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput === "demo") {
      setIsAuthenticated(true);
      sessionStorage.setItem("do_pfm_token", "demo");
    } else {
      setLoginError("Invalid access token. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--fluent-bg)]">
      <header className="h-12 bg-[#0078d4] text-white flex items-center px-4 gap-2">
        <span className="font-semibold text-sm">OCR AI</span>
        <span className="text-white/60">|</span>
        <span className="text-sm">Document Intelligence</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md fluent-panel rounded-sm p-6" style={{ boxShadow: "var(--fluent-shadow)" }}>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[var(--fluent-text)]">Sign in to OCR Arena</h1>
            <p className="text-sm text-[var(--fluent-text-secondary)] mt-1">
              Compare OCR engines side-by-side
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--fluent-text)] mb-1.5">Access token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter access token"
                className="w-full border fluent-border rounded-sm px-3 py-2 text-sm bg-[var(--fluent-surface)] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              />
            </div>
            {loginError && <p className="text-[#d13438] text-sm">{loginError}</p>}
            <button type="submit" className="w-full fluent-btn-primary py-2 text-sm">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
