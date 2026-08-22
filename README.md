# Musiktrainer Web-App 3.2.4

## Fehlerkorrektur

Version 3.2.4 basiert auf der zuvor lauffähigen Version 3.2.2.

Die Vorzeichen werden jetzt direkt als einfache SVG-Geometrie gezeichnet und exakt um die Y-Position des Notenkopfes konstruiert. Die problematische Glyphen-Berechnung aus Version 3.2.3 wurde vollständig entfernt.

Dadurch soll der Test wieder zuverlässig starten und Kreuz, Be sowie Auflösungszeichen auf der richtigen Tonhöhe erscheinen.
