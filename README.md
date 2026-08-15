# Frankensnyder's Brain Train (Web-App)

Vokabeltrainer Deutsch ↔ Französisch nach dem Leitner-System. Läuft als
Progressive Web App (PWA) in Safari (iPhone/Mac) und Microsoft Edge (Windows) –
komplett lokal, ohne Server, ohne Kosten, ohne Apple-Entwicklerkonto.

Alle Daten (Vokabeln + Lernverlauf) werden ausschließlich im Browser des
jeweiligen Geräts gespeichert (localStorage). Es gibt bewusst keine
Synchronisation zwischen Geräten – jedes Gerät hat seinen eigenen Datenstand.

## Lokal testen

Da Service Worker und "Zum Home-Bildschirm" eine echte http(s)-Adresse
benötigen, reicht ein Doppelklick auf `index.html` nicht aus. Am einfachsten
lokal testen:

```bash
cd braintrain
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen (auf dem Mac z. B. mit
Python 3, das auf macOS vorinstalliert ist).

## Kostenlos veröffentlichen (empfohlen: GitHub Pages)

1. Kostenloses GitHub-Konto anlegen (falls noch nicht vorhanden): https://github.com
2. Neues **privates** oder öffentliches Repository anlegen, z. B. `brain-train`.
3. Den Inhalt dieses Ordners in das Repository hochladen (per GitHub Desktop,
   `git push` oder Drag & Drop im Browser).
4. Im Repository unter **Settings → Pages** als Quelle den `main`-Branch (Ordner `/root`)
   auswählen und speichern.
5. Nach ein bis zwei Minuten ist die App unter
   `https://<dein-benutzername>.github.io/brain-train/` erreichbar.

Alternative: [Netlify Drop](https://app.netlify.com/drop) – dort kann der
komplette Ordner einfach per Drag & Drop hochgeladen werden, ganz ohne
GitHub-Konto. Man erhält sofort eine feste URL.

## Auf dem iPhone installieren

1. Die oben erhaltene URL in **Safari** öffnen (nicht Chrome – "Zum
   Home-Bildschirm" mit vollem Offline-Support funktioniert auf iOS nur in Safari).
2. Auf das Teilen-Symbol tippen → **"Zum Home-Bildschirm"**.
3. Die App erscheint als eigenes Icon und startet im Vollbild, ganz ohne
   Browser-Oberfläche.
4. Einmal öffnen, solange Internet verfügbar ist – danach funktioniert die App
   auch offline (Service Worker cached alle Dateien).

## Auf dem Windows-Rechner mit Edge nutzen

Einfach die URL in Edge öffnen. Optional kann man auch dort über das Menü
**"Zu Startseite hinzufügen"** bzw. **"App installieren"** ein eigenes
Fenster/Icon einrichten – für die reine Nutzung reicht aber ein normaler
Browser-Tab.

## Datensicherung

Unter **Übersicht** gibt es drei Aktionen:

- **CSV exportieren** – alle Vokabeln inkl. Leitner-Status als CSV-Datei.
- **Backup exportieren** – vollständige Sicherung (Vokabeln + Lernverlauf) als
  JSON-Datei. Empfehlenswert von Zeit zu Zeit zu sichern, da Browser-Speicher
  grundsätzlich verloren gehen kann (z. B. bei "Website-Daten löschen").
- **Backup importieren** – stellt einen zuvor exportierten Datenstand wieder her
  (überschreibt den aktuellen Stand auf diesem Gerät).

## Projektstruktur

```
index.html          Grundgerüst mit den 5 Screens
styles.css           Gesamtes Styling
manifest.json        PWA-Manifest (Name, Icons, Farben)
service-worker.js     Offline-Caching
icons/                App-Icons für den Home-Bildschirm
js/leitner.js         Leitner-Logik (Boxen, Intervalle, Übergänge)
js/storage.js         localStorage, CSV-/JSON-Export/Import
js/store.js           Zentraler Datenspeicher der laufenden Session
js/charts.js          Abhängigkeitsfreie SVG-Diagramme
js/screens/*.js       Je ein Modul pro Screen (Home, Lernen, Neu, Übersicht, Statistik)
```

## Bekannte Annahmen (siehe auch Projekt-Notiz "scoping-ergaenzungen-webapp.md")

- Fällige-Karten-Zählung: alle Box-1-Karten + fällige Karten aus Box 2–5.
- CSV-Format: `Deutsch;Französisch` bzw. `Deutsch,Französisch`, keine Kopfzeile nötig.
- Lernreihenfolge: älteste fällige Karte zuerst.
- Sowohl bei "Richtig" als auch bei "Falsch" leuchtet die Karte laut
  Originalvorgabe kurz grün auf (kein Rot bei Falsch) – Buttons sind zur
  besseren Unterscheidung dennoch rot/grün eingefärbt.
