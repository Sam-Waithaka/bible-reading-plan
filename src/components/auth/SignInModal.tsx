import { useState } from "react";
import type { FormEvent } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  UserCircle,
  X,
} from "lucide-react";
import { requestPasswordReset } from "../../services/authApi";
import { useAuth } from "../../hooks/useAuth";

type SignInModalProps = {
  darkMode: boolean;
  onClose: () => void;
  open: boolean;
};

const accountMissingMessage =
  "We could not find an account with those details. Please contact the church admin for account creation.";

const SignInModal = ({ darkMode, onClose, open }: SignInModalProps) => {
  const auth = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setSubmitting(true);

    try {
      await auth.signIn(identifier, password);
      window.location.assign("/portal");
    } catch {
      setError(accountMissingMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!identifier.trim()) {
      setError(
        "Enter your email, phone, or username first, then request a password reset.",
      );
      return;
    }

    setError("");
    setResetMessage("");
    setResetting(true);

    try {
      await requestPasswordReset(identifier);
      setResetMessage(
        "If this account exists, password reset instructions will be sent to the email address provided.",
      );
    } catch {
      setError(accountMissingMessage);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close sign in"
      />
      <form
        onSubmit={handleSubmit}
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-7 ${
          darkMode
            ? "border-white/10 bg-zinc-950 text-stone-100 shadow-black/40"
            : "border-black/10 bg-[#fffaf0] text-zinc-950 shadow-zinc-900/20"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`grid size-12 place-items-center rounded-2xl ${darkMode ? "bg-white/10 text-red-100" : "bg-red-950/5 text-red-800"}`}
            >
              <UserCircle size={23} />
            </span>
            <h2 className="mt-5 text-2xl font-black">Sign in</h2>
            <p
              className={`mt-2 text-sm leading-6 ${darkMode ? "text-stone-400" : "text-zinc-600"}`}
            >
              Access your church account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`grid size-10 shrink-0 place-items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-red-700 ${
              darkMode
                ? "border-white/10 bg-white/10 hover:bg-white/15"
                : "border-black/10 bg-white hover:bg-[#f8f5ef]"
            }`}
            aria-label="Close sign in"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            Email, phone, or username
            <span
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 ${darkMode ? "border-white/10 bg-white/[0.06]" : "border-black/10 bg-white"}`}
            >
              <Mail
                size={17}
                className={darkMode ? "text-stone-400" : "text-zinc-500"}
              />
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                autoComplete="username"
                required
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Password
            <span
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 ${darkMode ? "border-white/10 bg-white/[0.06]" : "border-black/10 bg-white"}`}
            >
              <KeyRound
                size={17}
                className={darkMode ? "text-stone-400" : "text-zinc-500"}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className={`grid size-8 shrink-0 place-items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-red-700 ${
                  darkMode
                    ? "text-stone-400 hover:bg-white/10 hover:text-stone-100"
                    : "text-zinc-500 hover:bg-black/5 hover:text-zinc-900"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
        </div>

        {error && (
          <p
            className="mt-4 rounded-2xl border border-red-800/20 bg-red-800/10 px-4 py-3 text-sm font-bold text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {resetMessage && (
          <p
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${darkMode ? "border-white/10 bg-white/[0.06] text-stone-200" : "border-black/10 bg-white text-zinc-700"}`}
            role="status"
          >
            {resetMessage}
          </p>
        )}

        <div className="mt-6 grid gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="grid min-h-12 place-items-center rounded-full bg-red-800 px-5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="size-5 motion-safe:animate-spin"
                  aria-hidden="true"
                />
                <span className="sr-only">Signing in</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className={`min-h-11 rounded-full border px-5 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
              darkMode
                ? "border-white/10 bg-white/10 text-stone-100 hover:bg-white/15"
                : "border-black/10 bg-white text-zinc-800 hover:bg-[#f8f5ef]"
            }`}
          >
            {resetting ? "Sending reset..." : "Forgot password?"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignInModal;
