# Musiktrainer Web-App

Dies ist die neue Projektbasis des Musiktrainers. Die Anwendung ist nicht mehr in einer einzigen HTML-Datei gespeichert, sondern in getrennte Dateien gegliedert.

## Dateien

- `index.html` – Oberfläche
- `styles.css` – Gestaltung
- `app.js` – Aufgabenlogik, Testgenerator und Auswertung
- `config.js` – Grundeinstellungen
- `.nojekyll` – verhindert eine unnötige Jekyll-Verarbeitung bei GitHub Pages

## Auf GitHub Pages veröffentlichen

1. Ein neues öffentliches GitHub-Repository erstellen, zum Beispiel `musiktrainer`.
2. Alle Dateien aus diesem Ordner in das Hauptverzeichnis des Repositorys hochladen.
3. Unter **Settings → Pages** die Veröffentlichung aus dem Branch `main` und dem Ordner `/ (root)` aktivieren.
4. Die Adresse lautet anschließend üblicherweise:
   `https://DEIN-NAME.github.io/musiktrainer/`

Es muss keine Datei umbenannt werden: `index.html` ist bereits vorhanden.

## Lehrerbereich

Die Standard-PIN steht in `config.js`:

```js
teacherPin: "2000"
```

Dort kann sie vor dem Hochladen geändert werden.

## Aktueller Speicherbetrieb

Die Ergebnisse werden weiterhin lokal im Browser gespeichert. Damit Ergebnisse von mehreren Schüler-iPads zentral beim Lehrer ankommen, wird als nächster Entwicklungsschritt ein Cloud-Datendienst ergänzt.

## Nächste Ausbaustufe

- Lehrer- und Schülerkonten
- Klassen und Kurse
- zentrale Tests
- zentrale Ergebnisübertragung
- QR-Code direkt im Lehrerbereich
- Bearbeitungszeit und Testfreigabe
- Aufgabenbibliothek
