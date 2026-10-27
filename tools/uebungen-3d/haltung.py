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


def ablauf(bild: int, bilder: int, pause: float = 0.1) -> float:
    """Phase 0 (Ausgang) bis 1 (Endposition) und zurück, mit Pausen an beiden Endpunkten."""
    t = (bild % bilder) / bilder
    p = pause / 2
    hin = 0.5 - 2 * p + 0.04
    if t < p:
        return 0.0
    if t < p + hin:
        return weich((t - p) / hin)
    if t < 2 * p + hin + p:
        return 1.0
    zurueck_start = 3 * p + hin
    return 1.0 - weich((t - zurueck_start) / (1.0 - p - zurueck_start))
