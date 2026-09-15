# Musiktrainer Web-App 3.3.0 – Supabase

Version 3.3.0 ergänzt eine zentrale Ergebnisspeicherung über Supabase.

## Was sich ändert

- Testergebnisse werden weiterhin zuerst lokal im Browser gespeichert.
- Wenn Supabase eingerichtet ist, wird jedes neue Ergebnis zusätzlich in die Cloud übertragen.
- Schlägt die Übertragung fehl, bleibt das lokale Ergebnis erhalten und kann später erneut synchronisiert werden.
- Im Lehrerbereich gibt es eine Supabase-Anmeldung und eine zentrale Ergebnisansicht.
- Vorhandene lokale Ergebnisse können mit **„Lokale Ergebnisse hochladen“** nachträglich übertragen werden.
- CSV-Export verwendet die aktuell angezeigte Ergebnisliste (lokal oder Cloud).

Klassen, Schülerprofile und Testvorlagen bleiben in dieser Version noch lokal.

## Supabase einrichten

1. Neues Supabase-Projekt anlegen.
2. Im Supabase Dashboard den **SQL Editor** öffnen.
3. Den kompletten Inhalt von `supabase_setup.sql` ausführen.
4. Unter **Authentication > Users** ein Lehrerkonto anlegen.
5. Öffentliche Registrierung/Sign-ups deaktivieren, wenn nur von dir angelegte Lehrerkonten Zugriff bekommen sollen.
6. Projekt-URL und **Publishable Key** (oder älteren anon key) aus Supabase kopieren.
7. In `config.js` eintragen:

```js
supabase: {
  enabled: true,
  url: "https://DEIN-PROJEKT.supabase.co",
  publishableKey: "DEIN_PUBLISHABLE_KEY"
}
```

Danach alle Dateien zu GitHub Pages hochladen und die Seite vollständig neu laden.

## Sicherheit

Der Publishable/anon Key darf in einer Browser-App sichtbar sein. Er ist **kein geheimes Passwort**. Die eigentliche Zugriffskontrolle erfolgt über PostgreSQL Row Level Security (RLS).

Die mitgelieferte SQL-Konfiguration erlaubt:
- nicht angemeldeten Schülergeräten: **nur INSERT** neuer Ergebnisse
- angemeldeten Supabase-Nutzern: **nur SELECT** der Ergebnisse

Es wird kein Supabase Service Role Key in der Web-App verwendet.

## Bestehende lokale Ergebnisse

Nach der Einrichtung:
1. Lehrerbereich öffnen.
2. Mit Supabase-Lehrerkonto anmelden.
3. **„Lokale Ergebnisse hochladen“** wählen.

Das muss auf jedem Gerät erfolgen, auf dem alte lokale Ergebnisse liegen und übernommen werden sollen.
