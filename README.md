# Mondkatze

Jump&Run für Browser, Android und iPhone (PWA). Reines JavaScript, keine Bibliotheken, kein Build-Schritt.

## Starten

```
python tools/serve.py          # im Projektordner, dann http://localhost:8000
```

Admin-/Testmodus (eigener Spielstand, alle Cheats): `http://localhost:8000/index.html?admin=1`
Im Admin-Modus öffnet der 🛠-Knopf (oder F2) das Panel.

Auf dem Handy: im selben WLAN `http://<PC-IP>:8000` öffnen und "Zum Startbildschirm" wählen.
Auf dem Titelbildschirm steht unten die Version – so siehst du, ob der Browser die neuen Dateien geladen hat.

## Ordner

```
index.html            Einstieg, lädt alle Skripte in fester Reihenfolge
admin.html            Weiterleitung auf index.html?admin=1
manifest.json, icon.svg, sw.js   PWA (sw.js muss im Hauptordner liegen)
tools/serve.py        lokaler Server ohne Browser-Zwischenspeicher

src/data/             reine Daten, keine Logik
  data.js             Welten, Gegner, Bosse, Items, Skillbaum, Story, Läden
  data2.js            Level-Stile, Mechaniken, Paletten, Level-Namen, Gegner-Eigenheiten
src/audio/
  audio.js            Sound-Effekte + Musik (WebAudio), Einstellungen (PREFS), Vibration
src/render/           Zeichnen, ohne Spielregeln
  art.js              Katzen Luna und Chey
  creatures.js        Gegner- und Boss-Figuren
  scenery.js          Hintergrund, Wetter, Drache, Vignette
  cine.js             Filmsequenzen
src/game/             Spielregeln und Spielmodi
  level.js            Jump&Run: Level-Generator, Physik, Gegner, Geheimräume (Klasse Run)
  battle.js           Bosskampf-Ablauf        arena.js  Bühne des Bosskampfs
  map.js              Weltkarte               extras.js Garderobe, Album, Erfolge, Neues Spiel+, Geister
  minigames.js        Angeln und Memory in den Läden
src/app/              Anwendung
  app.js              Oberfläche, Spielstand, Läden, Pause, Tipps, Einstellungen, Eingabe
  cloud.js            Export-Code und Cloud-Sync (Firebase REST)
  admin.js            Admin-Panel (nur mit ?admin=1)
```

## Wichtig beim Ändern

- Alle Dateien sind klassische Skripte mit gemeinsamen globalen Namen. Die Ladereihenfolge steht in `index.html`
  (Daten → Audio → Zeichnen → Spiel → Anwendung). Neue Datei: dort eintragen **und** in `sw.js` (Liste `F`).
- Nach Änderungen die Versionsnummer `?v=` in `index.html` und `mondkatze-vN` in `sw.js` erhöhen, sonst zeigt der Browser alte Dateien.
- Spielstand: `localStorage['mondkatze']` (Admin: `mondkatze_admin`), Einstellungen: `mk_prefs`, Geister: `mk_ghost_*`.

## Online-Funktionen einrichten (Konten + Online-Koop, kostenlos)

Das Spiel braucht dafür ein eigenes Firebase-Projekt (Spark-Tarif, 0 €). Einmalig:

1. Auf console.firebase.google.com ein Projekt anlegen.
2. Build → Authentication → Anmeldemethode → **E-Mail/Passwort** aktivieren.
3. Build → Realtime Database → Datenbank erstellen (Region Europa).
4. In der Datenbank den Tab **Regeln** öffnen, diesen Text einfügen und veröffentlichen:

```
{
  "rules": {
    "users": { "$uid": { ".read": "auth.uid === $uid", ".write": "auth.uid === $uid" } },
    "rooms": { "$room": { ".read": "auth != null", ".write": "auth != null" } },
    "saves": { "$code": { ".read": true, ".write": true, ".validate": "newData.hasChildren(['ts','data'])" } }
  }
}
```

5. Projekteinstellungen → Allgemein → **Web-API-Schlüssel** kopieren, dazu die **Datenbank-URL**. Beides in `src/app/config.js` eintragen, committen und pushen. Dann können alle Spieler Konten anlegen. (Alternativ jeder Spieler selbst im Spiel unter Konto → Einrichtung.)

Wie es funktioniert:
- **Konto** = Spielername + Passwort. Der Spielstand liegt in `users/<uid>/save` und ist nur für das eigene Konto lesbar. Beide Spieler eines Koop-Levels speichern ihren Fortschritt im eigenen Konto.
- **Online-Koop** = ein Spieler erstellt einen Raum (5-stelliger Code), der andere tritt bei. Die Geräte verbinden sich direkt per WebRTC; Firebase vermittelt nur das Finden. Der Host wählt das Level, rechnet das Spiel und schickt Schnappschüsse; der Gast bewegt seine Katze selbst und wird abgeglichen.
- Bei strengen Netzen (manche Mobilfunk-Anbieter, Firmen-WLAN) kann die direkte Verbindung scheitern.

Ohne Firebase testen: `node tools/mock-firebase.js` startet einen lokalen Nachbau (Port 9099), siehe Kommentar in der Datei.
