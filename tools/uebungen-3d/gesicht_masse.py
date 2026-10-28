"""Gesichtsmaße aus Landmarken (Korrekturrunde 4, D-437): dieselben Verhältnisse für ein Foto und für
ein Rendering des Modells, damit die Gesichtsregler von MakeHuman an die Fotos angepasst werden können
(`gesicht_anpassen.py`). Braucht nur NumPy, läuft in jeder Umgebung.

Landmarken: die 468 Punkte des Face Landmarker von MediaPipe (Apache 2.0), Nummern nach dessen
kanonischem Gesichtsnetz; die Iris (468 bis 477) wird nicht gebraucht. Alle Maße sind Verhältnisse:
Gesichtshöhe (Stirnpunkt 10 bis Kinn 152) und Gesichtsbreite (Wangenränder 234 und 454) sowie die
Spanne der äußeren Augenwinkel (33 und 263); damit sind sie unabhängig von Bildgröße und Abstand.
Perspektive bleibt eine Fehlerquelle: Ein Selfie aus 40 cm vergrößert die Nase gegenüber dem
Rendering mit langer Brennweite.

Die Fotos selbst, ihre Landmarken und alles daraus Abgeleitete bleiben außerhalb des Repositorys.
"""
from __future__ import annotations

import numpy as np

# Landmarken des Face Landmarker (Nummern des kanonischen Netzes)
I = {
    "stirn": 10, "kinn": 152, "wange_r": 234, "wange_l": 454, "kiefer_r": 58, "kiefer_l": 288,
    "unterkiefer_r": 172, "unterkiefer_l": 397, "auge_r_aussen": 33, "auge_r_innen": 133,
    "auge_l_innen": 362, "auge_l_aussen": 263, "lid_r_oben": 159, "lid_r_unten": 145, "lid_l_oben": 386,
    "lid_l_unten": 374, "nasion": 168, "nasenspitze": 1, "subnasale": 2, "nase_r": 129, "nase_l": 358,
    "mund_r": 61, "mund_l": 291, "oberlippe_oben": 0, "oberlippe_unten": 13, "unterlippe_oben": 14,
    "unterlippe_unten": 17, "braue_r": 105, "braue_l": 334, "braue_r_innen": 107, "braue_l_innen": 336,
    "wangenknochen_r": 116, "wangenknochen_l": 345, "braue_r_aussen": 70, "braue_l_aussen": 300,
}
# Gewicht je Maß beim Anpassen (Nasenbreite und Lippen leiden unter der Perspektive der Selfies)
GEWICHT = {"nase_breite": 0.6, "oberlippe": 0.7, "unterlippe": 0.7, "mund_tiefe": 0.8}


def masse(P) -> dict[str, float]:
    """Verhältnisse aus den 2D-Landmarken `P` (n × 2, Pixel, y nach unten)."""
    P = np.asarray(P, dtype=float)[:, :2]
    fehlt = ~np.any(P != 0, axis=1)  # Landmarken ohne Zuordnung (Rückprojektion daneben) sind (0, 0)

    def p(n):
        return np.full(2, np.nan) if fehlt[I[n]] else P[I[n]]

    def dist(a, b):
        return float(np.linalg.norm(p(a) - p(b)))

    aussen = dist("auge_r_aussen", "auge_l_aussen")
    breite = dist("wange_r", "wange_l")
    hoehe = dist("stirn", "kinn")
    augenbreite = (dist("auge_r_aussen", "auge_r_innen") + dist("auge_l_aussen", "auge_l_innen")) / 2
    mund = dist("mund_r", "mund_l")
    return {
        "gesicht_hoehe_breite": hoehe / breite,
        "augen_breite": aussen / breite,
        "kiefer_breite": dist("kiefer_r", "kiefer_l") / breite,
        "unterkiefer_breite": dist("unterkiefer_r", "unterkiefer_l") / breite,
        "wangenknochen": dist("wangenknochen_r", "wangenknochen_l") / breite,
        "kinn_hoehe": dist("unterlippe_unten", "kinn") / hoehe,
        "stirn_hoehe": dist("stirn", "nasion") / hoehe,
        "nase_laenge": dist("nasion", "subnasale") / hoehe,
        "nase_breite": dist("nase_r", "nase_l") / aussen,
        "mund_breite": mund / aussen,
        "mund_tiefe": (p("unterlippe_unten")[1] - p("subnasale")[1]) / hoehe,
        "mundwinkel": ((p("mund_r")[1] + p("mund_l")[1]) / 2 - p("subnasale")[1]) / hoehe,
        "oberlippe": dist("oberlippe_oben", "oberlippe_unten") / mund,
        "unterlippe": dist("unterlippe_oben", "unterlippe_unten") / mund,
        "auge_breite": augenbreite / aussen,
        "auge_hoehe": ((dist("lid_r_oben", "lid_r_unten") + dist("lid_l_oben", "lid_l_unten")) / 2) / augenbreite,
        "augen_innen": dist("auge_r_innen", "auge_l_innen") / aussen,
        "braue_hoehe": ((dist("braue_r", "lid_r_oben") + dist("braue_l", "lid_l_oben")) / 2) / augenbreite,
        "brauen_innen": dist("braue_r_innen", "braue_l_innen") / aussen,
        "brauen_winkel": ((p("braue_r_aussen")[1] - p("braue_r_innen")[1]) + (p("braue_l_aussen")[1] - p("braue_l_innen")[1])) / 2 / augenbreite,
    }


def mittel(liste: list[dict[str, float]]) -> dict[str, float]:
    """Mittel mehrerer Fotos je Maß."""
    return {k: float(np.mean([m[k] for m in liste])) for k in liste[0]}


def loesen(ist: dict[str, float], soll: dict[str, float], jacobi: dict[str, dict[str, float]], regler: list[str],
           daempfung: float = 0.05, grenze: float = 1.0) -> dict[str, float]:
    """Reglerwerte, die die Maße `ist` den Maßen `soll` annähern: gedämpfte kleinste Quadrate über die
    Empfindlichkeit `jacobi[maß][regler]` (Änderung je Reglerwert 1), Werte auf ±`grenze` begrenzt."""
    namen = [k for k in soll if k in ist and np.isfinite(ist[k]) and np.isfinite(soll[k])]
    A = np.array([[jacobi[k].get(r, 0.0) * GEWICHT.get(k, 1.0) for r in regler] for k in namen])
    b = np.array([(soll[k] - ist[k]) * GEWICHT.get(k, 1.0) for k in namen])
    # skaliert: Maße sind Verhältnisse um 0,1 bis 1,5, die Dämpfung bezieht sich auf die Spaltennormen
    n = np.linalg.norm(A, axis=0)
    n[n < 1e-9] = 1.0
    As = A / n
    x = np.linalg.solve(As.T @ As + daempfung * np.eye(len(regler)), As.T @ b) / n
    return {r: float(np.clip(v, -grenze, grenze)) for r, v in zip(regler, x)}


def abweichung(ist: dict[str, float], soll: dict[str, float]) -> float:
    """Gewichteter mittlerer Fehler der Maße (relativ zum Sollwert), in Prozent."""
    f = [abs(ist[k] - soll[k]) / max(abs(soll[k]), 1e-6) * GEWICHT.get(k, 1.0)
         for k in soll if k in ist and np.isfinite(ist[k]) and np.isfinite(soll[k])]
    return float(np.mean(f) * 100)
