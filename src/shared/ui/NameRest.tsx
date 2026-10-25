/**
 * Rest eines Namens nur für Screenreader (D-377, WCAG 2.5.3 „Label in Name“): Ein Link oder Knopf
 * bekommt seinen Namen aus dem sichtbaren Text und diesem unsichtbaren Rest, z. B. „Lesen“ und
 * „bearbeiten“, statt eines `aria-label`, das den sichtbaren Text nur zum Teil enthält.
 *
 * `full` ist der ganze Name, `visible` der sichtbare Anfang. Der versteckte Teil steht außerhalb
 * des Textflusses (`sr-only`), Browser trennen ihn deshalb mit einem Leerzeichen ab; das
 * Leerzeichen davor sorgt dafür, dass der Name überall gleich lautet, auch in den Unit-Tests.
 * Der Rest beginnt darum mit einem Wort, nicht mit einem Satzzeichen.
 *
 * Als eigenes Kind des Links oder Knopfs setzen, nicht in abgeschnittenen Text (`truncate`): Dort
 * stünde der versteckte Teil hinter dem Zeilenende und machte die Seite breiter.
 */
export function NameRest({ full, visible }: { full: string; visible: string }) {
  const text = (full.startsWith(visible) ? full.slice(visible.length) : full).trim();
  if (!text) return null;
  return (
    <>
      {' '}
      <span className="sr-only">{text}</span>
    </>
  );
}
