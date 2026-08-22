# Musiktrainer Web-App 3.2.5

Diese Version wurde neu auf der funktionierenden Version 3.2 aufgebaut.

## Behoben
- Startfehler durch versehentlich entfernte Modul-Funktionen beseitigt
- Tonarten, Harmonielehre, Skalen und Dreiklänge bleiben vollständig erhalten
- Gehörbildung nutzt bei Tonhöhen einen benannten Referenzton
- Vorzeichen werden als einfache SVG-Geometrie direkt um die Tonhöhe des Notenkopfes gezeichnet

## Ursache des früheren Startfehlers
Beim Umbau der Gehörbildung waren in einer späteren Version versehentlich `scalePool` und `triadPool` beziehungsweise weitere Modul-Funktionen aus `app.js` entfernt worden. Der Startknopf referenzierte diese Funktionen weiterhin.
