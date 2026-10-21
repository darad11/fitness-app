import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { Button, Dialog } from '@/shared/ui';
import { normalizeBarcode } from '../calc/barcode';
import { createDetector } from './barcodeDetector';

const INPUT = 'field w-full min-w-0';

type Camera = 'starting' | 'running' | 'denied' | 'unsupported' | 'error';

/**
 * Barcode scannen (NU-07): Rückkamera mit Erkennung alle 250 ms, daneben Eingabe von Hand. Der
 * Kamerastrom endet, sobald ein gültiger Code erkannt ist oder der Dialog schließt.
 */
export function ScannerDialog({
  onClose,
  onCode,
  status,
}: {
  onClose: () => void;
  onCode: (code: string) => void;
  /** Ergebnis der Suche, z. B. „nicht gefunden“ mit Knöpfen. */
  status?: ReactNode;
}) {
  const id = useId();
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<Camera>('starting');
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (found) return;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const run = { stopped: false };
    // Als Funktion gelesen, weil sich der Wert zwischen den `await` ändern kann.
    const isStopped = () => run.stopped;
    const stop = () => {
      run.stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
    const start = async () => {
      const media = (navigator as { mediaDevices?: MediaDevices }).mediaDevices;
      if (!media) {
        setCamera('unsupported');
        return;
      }
      try {
        stream = await media.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (caught) {
        setCamera(
          caught instanceof DOMException && caught.name === 'NotAllowedError' ? 'denied' : 'error',
        );
        return;
      }
      if (isStopped() || !video.current) {
        stop();
        return;
      }
      video.current.srcObject = stream;
      await video.current.play().catch(() => undefined);
      setCamera('running');
      const detector = await createDetector().catch(() => null);
      if (!detector || isStopped()) {
        if (!detector) setCamera('error');
        return;
      }
      let busy = false;
      timer = setInterval(() => {
        const element = video.current;
        if (busy || !element || element.readyState < 2) return;
        busy = true;
        detector
          .detect(element)
          .then((codes) => {
            for (const { rawValue } of codes) {
              const code = normalizeBarcode(rawValue);
              if (code && !isStopped()) {
                stop();
                setFound(true);
                onCodeRef.current(code);
                return;
              }
            }
          })
          .catch(() => undefined)
          .finally(() => {
            busy = false;
          });
      }, 250);
    };
    void start();
    return stop;
  }, [found]);

  const submitManual = () => {
    const code = normalizeBarcode(manual);
    if (!code) {
      setError(tNutrition.barcode.invalid);
      return;
    }
    setError(null);
    setFound(true);
    onCode(code);
  };

  const cameraText: Record<Exclude<Camera, 'running'>, string> = {
    starting: tNutrition.barcode.starting,
    denied: tNutrition.barcode.denied,
    unsupported: tNutrition.barcode.unsupported,
    error: tNutrition.barcode.cameraError,
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={tNutrition.barcode.title}
      closeLabel={t.common.close}
      variant="sheet"
    >
      <div className="grid gap-4 overflow-y-auto p-4">
        {!found ? (
          <div className="relative overflow-hidden rounded-card bg-ink">
            <video
              ref={video}
              playsInline
              muted
              aria-label={tNutrition.barcode.hint}
              className="aspect-[4/3] w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-card border-2 border-on-ink"
            />
          </div>
        ) : null}
        {!found ? (
          <p role="status" className="text-sm text-muted">
            {camera === 'running' ? tNutrition.barcode.hint : cameraText[camera]}
          </p>
        ) : null}
        {status}
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitManual();
          }}
        >
          <label htmlFor={`${id}-code`} className="text-sm font-semibold text-muted">
            {tNutrition.barcode.manualLabel}
          </label>
          <div className="flex gap-2">
            <input
              id={`${id}-code`}
              inputMode="numeric"
              autoComplete="off"
              aria-describedby={`${id}-hint`}
              value={manual}
              onChange={(event) => {
                setManual(event.target.value);
                setError(null);
              }}
              className={INPUT}
            />
            <Button type="submit" variant="secondary">
              {tNutrition.barcode.search}
            </Button>
          </div>
          <p id={`${id}-hint`} className="text-xs text-muted">
            {tNutrition.barcode.manualHint}
          </p>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </Dialog>
  );
}
