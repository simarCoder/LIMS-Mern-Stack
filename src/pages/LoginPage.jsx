import { useState, useEffect } from "react";
import {
  Microscope,
  Building2,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { fetchLabByCode } from "../services/api";

export default function LoginPage({ onLoginSuccess, authError: initialError = "" }) {
  const [labCode, setLabCode] = useState("LAB01");
  const [labName, setLabName] = useState("");
  const [isLookingUpLab, setIsLookingUpLab] = useState(false);
  const [labFound, setLabFound] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);

  function handleLabCodeChange(val) {
    const uppercaseVal = val.toUpperCase();
    setLabCode(uppercaseVal);
    if (!uppercaseVal.trim()) {
      setLabName("");
      setLabFound(false);
    }
  }

  // Debounced lookup of Lab Name by Lab Code
  useEffect(() => {
    const code = labCode.trim().toUpperCase();
    if (!code) return;

    let active = true;
    const timer = setTimeout(() => {
      setIsLookingUpLab(true);
      fetchLabByCode(code)
        .then((data) => {
          if (active && data?.lab_name) {
            setLabName(data.lab_name);
            setLabFound(true);
            setErrorMessage("");
          }
        })
        .catch(() => {
          if (active) {
            setLabName("");
            setLabFound(false);
          }
        })
        .finally(() => {
          if (active) setIsLookingUpLab(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [labCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    const code = labCode.trim().toUpperCase();
    const uname = username.trim();

    if (!code) {
      setErrorMessage("Please enter the Lab Code.");
      return;
    }
    if (!uname) {
      setErrorMessage("Please enter your Username.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your Password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLoginSuccess(code, uname, password);
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Quick preset helper for development/testing
  function handleQuickFill(presetRole) {
    setLabCode("LAB01");
    if (presetRole === "developer") {
      setUsername("developer");
      setPassword("dev123");
    } else if (presetRole === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("staff");
      setPassword("staff123");
    }
    setErrorMessage("");
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#07080a] p-4 sm:p-6 text-zinc-100 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20 mb-3 border border-teal-400/30">
            <Microscope size={28} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            labora<span className="text-teal-400">+</span> LIMS
          </h1>
        </div>

        {/* Deep Charcoal / Obsidian Login Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0f14] p-6 sm:p-7 shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5 mb-5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Sign In</h2>
            </div>
            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/25">
              Secure Session
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Lab Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Lab Code *
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  value={labCode}
                  onChange={(e) => handleLabCodeChange(e.target.value)}
                  placeholder="e.g. LAB01"
                  className="w-full rounded-xl border border-zinc-800 bg-[#060709] py-2.5 pl-10 pr-10 text-sm font-mono font-bold text-white uppercase placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                {labFound && (
                  <CheckCircle2
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400"
                  />
                )}
              </div>
            </div>

            {/* Lab Name (Autofilled display) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Lab Name (Autofilled)
              </label>
              <input
                type="text"
                value={
                  isLookingUpLab
                    ? "Verifying lab code..."
                    : labName || (labCode ? "No laboratory found for this code" : "Enter Lab Code above")
                }
                readOnly
                disabled
                className={`w-full rounded-xl border py-2.5 px-3.5 text-xs sm:text-sm font-medium select-none ${
                  labFound
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300 font-semibold"
                    : "border-zinc-800/50 bg-[#08090b] text-zinc-500 italic"
                }`}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Username *
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. developer, admin, or staff"
                  autoComplete="username"
                  className="w-full rounded-xl border border-zinc-800 bg-[#060709] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-zinc-800 bg-[#060709] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 border-t border-zinc-800/80 pt-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-teal-400" />
              <span>Quick Test Accounts (Click to Fill):</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("developer")}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/20 cursor-pointer"
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("user")}
                className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1.5 text-xs font-bold text-teal-300 transition hover:bg-teal-500/20 cursor-pointer"
              >
                Staff (User)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
