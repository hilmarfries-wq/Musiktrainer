# Musiktrainer Web-App 3.0.2

Version 3.0 ist die erste Plattformversion des Musiktrainers.

## Neue Funktionen

- lokale Klassenverwaltung
- Schülerprofile pro Klasse
- Profilwahl im Schülerbereich
- wiederverwendbare Testbibliothek
- gespeicherte Testvorlagen
- Schülerlinks direkt aus der Bibliothek öffnen oder kopieren
- bestehende Module: Notenlesen, Rhythmus, Intervalle und Gehörbildung
- SVG-Darstellung für Rhythmus und Notensysteme
- CSV-Export sowie JSON-Sicherung

## Wichtig zur Speicherung

GitHub Pages stellt nur die Webseite bereit. Klassen, Testvorlagen und Ergebnisse werden derzeit im Browser des jeweiligen Geräts gespeichert.

Das bedeutet:

- Auf deinem Lehrergerät bleiben deine Klassen und Vorlagen erhalten.
- Auf einem anderen Gerät erscheinen diese Daten nicht automatisch.
- Ein erzeugter Schülerlink funktioniert auf anderen Geräten, weil die Testkonfiguration im Link enthalten ist.
- Ergebnisse der Schüler werden noch nicht automatisch an das Lehrergerät übertragen.

Für zentrale Ergebnisse, echte Benutzerkonten und geräteübergreifende Klassen wird im nächsten Schritt eine Cloud-Datenbank wie Firebase oder Supabase benötigt.

## Aktualisierung auf GitHub

Die Dateien `index.html`, `app.js`, `styles.css` und `README.md` ersetzen.

`config.js` wurde um die Versionsangabe ergänzt. Deine Lehrer-PIN kann dort weiterhin angepasst werden.


## Fehlerkorrektur 3.0.1

In Version 2.3 war beim Umbau der Notensystemgrafik versehentlich ein Teil der Aufgabenlogik entfernt worden. Version 3.0.1 stellt die vollständigen Aufgabenpools, die Auswertung und den Startvorgang wieder her. Die kompakteren Notensysteme sowie die Klassen- und Testbibliothek bleiben erhalten.


## Notenschlüssel-Korrektur 3.0.2

Die Notenschlüssel werden nicht mehr als browserabhängige Schriftzeichen dargestellt. Stattdessen nutzt die App feste SVG-Vektorpfade. Der Violinschlüssel liegt nun innerhalb des Notensystems und ist mit seiner Spirale an der G-Linie ausgerichtet.
