import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { tSync } from '@/shared/i18n/de-sync';
import { Button } from '@/shared/ui';

export type LoginMode = 'signIn' | 'signUp';

/**
 * Vollbild-Anmeldung (D-270; FORM D-316): modaler Dialog über der App (Fokus bleibt darin) auf
 * der Grundfläche der App, ohne Karte, Glas und Lichtflecken. Das Logo der Anmeldung steht bei
 * etwa 30 % der Höhe, darunter Claim und Unterzeile als Text, die Felder und „Anmelden“ als
 * Primärknopf. Die Grundfläche ist die der App, deshalb bleibt die Statusleiste einfarbig (D-281).
 * „Später“ und Escape schließen ohne Anmeldung. Umschalter zwischen Anmelden und Registrieren
 * (D-273); beim Registrieren wird das Passwort zweimal eingegeben und auf Mindestlänge geprüft.
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
  const ts = tSync;
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
      <div className="login-body relative flex min-h-full flex-col items-center px-page pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <Button
          variant="secondary"
          onClick={onLater}
          className="absolute top-[calc(env(safe-area-inset-top)+var(--spacing-edge-clear)+1rem)] left-page"
        >
          <X aria-hidden="true" className="size-4" />
          {ts.later}
        </Button>
        <div className="flex w-full max-w-dialog flex-col items-center text-center">
          {/* Startfokus auf dem Titel: kein Fokusring auf „Später“, keine Tastatur auf dem iPhone. */}
          <h2 id={`${id}-title`} ref={title} tabIndex={-1} className="outline-none">
            <img
              src="/brand/logo-anmeldung-dunkel.svg"
              alt={ts.loginTitle}
              width={280}
              height={67}
              className="brand-logo"
            />
          </h2>
          <p lang="en" className="form-claim">
            {ts.claim}
          </p>
          <p className="form-claim-sub">{ts.claimSub}</p>
          <p className="mt-8 text-sm text-muted">{signUp ? ts.signUpSubtitle : ts.loginSubtitle}</p>
          <form
            className="mt-6 grid w-full gap-3"
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
              className="field w-full"
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
              className="field w-full"
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
                  className="field w-full"
                />
              </>
            ) : null}
            {shownError ? (
              <p role="alert" className="text-sm text-danger">
                {shownError}
              </p>
            ) : notice ? (
              <p role="status" className="text-sm">
                {notice}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
              {signUp ? (busy ? ts.signingUp : ts.signUp) : busy ? ts.signingIn : ts.signIn}
            </Button>
          </form>
          <Button
            variant="quiet"
            className="mt-3"
            onClick={() => {
              setLocalError(null);
              setRepeat('');
              onModeChange(signUp ? 'signIn' : 'signUp');
            }}
          >
            {signUp ? ts.toSignIn : ts.toSignUp}
          </Button>
          <p className="mt-6 text-caption text-muted">{ts.loginNote}</p>
        </div>
      </div>
    </dialog>
  );
}
