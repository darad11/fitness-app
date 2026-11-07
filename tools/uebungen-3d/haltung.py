"""Zeitablauf einer Wiederholung (D-407).

Eine Wiederholung als nahtlose Schleife: kurze Pause in der Ausgangsposition, Weg zur Endposition,
kurze Pause dort, Weg zurück. Die Wege folgen dem Minimum-Ruck-Profil (10t³ − 15t⁴ + 6t⁵): weiches
Anfahren und Abbremsen ohne Sprung in Geschwindigkeit und Beschleunigung. Der Rückweg (konzentrisch)
ist etwas kürzer als der Hinweg. Bild `bilder` entspricht wieder Bild 0.
"""
from __future__ import annotations


def weich(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * t * (10 - 15 * t + 6 * t * t)


def ablauf(bild: int, bilder: int, pause: float = 0.1, pause_vorn: float | None = None) -> float:
    """Phase 0 (Ausgang) bis 1 (Endposition) und zurück, mit Pausen an beiden Endpunkten. `pause_vorn`: Pause im
    Ausgang, Vorgabe wie `pause`; 0 beim Rudern am Kabel („ohne Pause am vorderen Umkehrpunkt“, D-470). Mit der
    Vorgabe ist der Ablauf derselbe wie bis D-469."""
    t = (bild % bilder) / bilder
    pv = (pause if pause_vorn is None else pause_vorn) / 2  # Pause im Ausgang, je Hälfte am Anfang und am Ende
    pe = pause / 2  # Pause in der Endposition, je Hälfte
    hin = 0.5 - pv - pe + 0.04
    if t < pv:
        return 0.0
    if t < pv + hin:
        return weich((t - pv) / hin)
    if t < pv + hin + 2 * pe:
        return 1.0
    zurueck_start = pv + hin + 2 * pe
    return 1.0 - weich((t - zurueck_start) / (1.0 - pv - zurueck_start))
