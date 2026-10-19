import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { t } from '@/shared/i18n/de';

const GLOWS = [
  { className: '-top-28 -left-24 size-[420px]', color: 'var(--login-glow-1)', delay: '0s' },
  { className: '-right-20 -bottom-36 size-[360px]', color: 'var(--login-glow-2)', delay: '-6s' },
  {
    className: 'top-[40%] left-[60%] size-[260px] opacity-25',
    color: 'var(--login-glow-3)',
    delay: '-12s',
  },
] as const;

export type LoginMode = 'signIn' | 'signUp';

/**
 * Vollbild-Anmeldung (D-270): modaler Dialog über der App (Fokus bleibt darin), dunkler Grund
 * mit schwebenden Lichtflecken, Glas-Karte. „Später“ und Escape schließen ohne Anmeldung.
 * Umschalter zwischen Anmelden und Registrieren (D-273); beim Registrieren wird das Passwort
 * zweimal eingegeben und auf Mindestlänge geprüft.
 */
export function LoginScreen({
  mode,
  busy,
  error,
  notice,
  passwordMin,
  onModeChange,
  onSubmit,
  onLater,
}: {
  mode: LoginMode;
  busy: boolean;
  error: string | null;
  /** Hinweis ohne Fehler, z. B. „Bestätigungsmail gesendet“. */
  notice: string | null;
  passwordMin: number;
  onModeChange: (mode: LoginMode) => void;
  onSubmit: (mode: LoginMode, email: string, password: string) => void;
  onLater: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const ts = t.sync;
  const signUp = mode === 'signUp';
  const shownError = localError ?? error;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    title.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onLater();
      }}
      className="login-screen m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-transparent"
    >
      <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        {GLOWS.map((glow) => (
          <div
            key={glow.color}
            aria-hidden="true"
            className={`login-glow ${glow.className}`}
            style={{ background: glow.color, animationDelay: glow.delay }}
          />
        ))}
        <button
          type="button"
          onClick={onLater}
          className="login-later login-glass absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 flex min-h-11 items-center gap-1.5 rounded-pill px-4 font-semibold"
        >
          <X aria-hidden="true" className="size-4" />
          {ts.later}
        </button>
        <div className="login-glass relative w-full max-w-[420px] rounded-[28px] px-7 pt-10 pb-8 text-center shadow-float">
          <img
            src="/icons/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="mx-auto mb-4 size-[72px] rounded-[20px]"
          />
          {/* Startfokus auf dem Titel: kein Fokusring auf „Später“, keine Tastatur auf dem iPhone. */}
          <h2
            id={`${id}-title`}
            ref={title}
            tabIndex={-1}
            className="mb-2 text-3xl font-bold tracking-tight outline-none"
          >
            {ts.loginTitle}
          </h2>
          <p className="mb-7 text-[15px] leading-relaxed text-[var(--login-fg-muted)]">
            {signUp ? ts.signUpSubtitle : ts.loginSubtitle}
          </p>
          <form
            className="grid gap-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              if (signUp && password.length < passwordMin) {
                setLocalError(ts.passwordTooShort(passwordMin));
                return;
              }
              if (signUp && password !== repeat) {
                setLocalError(ts.passwordMismatch);
                return;
              }
              setLocalError(null);
              onSubmit(mode, email, password);
            }}
          >
            <label htmlFor={`${id}-email`} className="sr-only">
              {ts.email}
            </label>
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="username"
              placeholder={ts.email}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              className="login-input h-13 w-full rounded-[14px] px-4.5 text-base"
            />
            <label htmlFor={`${id}-password`} className="sr-only">
              {ts.password}
            </label>
            <input
              id={`${id}-password`}
              type="password"
              required
              autoComplete={signUp ? 'new-password' : 'current-password'}
              placeholder={signUp ? ts.passwordNew(passwordMin) : ts.password}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLocalError(null);
              }}
              className="login-input h-13 w-full rounded-[14px] px-4.5 text-base"
            />
            {signUp ? (
              <>
                <label htmlFor={`${id}-repeat`} className="sr-only">
                  {ts.passwordRepeat}
                </label>
                <input
                  id={`${id}-repeat`}
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder={ts.passwordRepeat}
                  value={repeat}
                  onChange={(event) => {
                    setRepeat(event.target.value);
                    setLocalError(null);
                  }}
                  className="login-input h-13 w-full rounded-[14px] px-4.5 text-base"
                />
              </>
            ) : null}
            {shownError ? (
              <p role="alert" className="text-sm text-[var(--login-error)]">
                {shownError}
              </p>
            ) : notice ? (
              <p role="status" className="text-sm text-[var(--login-fg)]">
                {notice}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="login-button mt-1 h-13 rounded-pill text-base font-bold disabled:opacity-60"
            >
              {signUp ? (busy ? ts.signingUp : ts.signUp) : busy ? ts.signingIn : ts.signIn}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              setRepeat('');
              onModeChange(signUp ? 'signIn' : 'signUp');
            }}
            className="login-later mt-4 min-h-11 rounded-pill px-3 text-[15px] font-semibold underline-offset-4 hover:underline"
          >
            {signUp ? ts.toSignIn : ts.toSignUp}
          </button>
          <p className="mt-6 text-[13px] leading-relaxed text-[var(--login-fg-muted)]">
            {ts.loginNote}
          </p>
        </div>
      </div>
    </dialog>
  );
}
