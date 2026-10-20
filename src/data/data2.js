// Level-Individualitaet: Namen, Stile, Mechaniken, Paletten pro Welt.
STORY.intro = STORY.intro.slice(2); // die ersten zwei Seiten zeigt jetzt der Film
const LV_NAMES = [
  ['Sonnenwiese', 'Pilzwald', 'Bachlauf', 'Eichenhain', 'Blumenhügel', 'Herbstpfad', 'Mooriger Steg', 'Nebeltal', 'Wurzeltreppe', 'Waldlichtung'],
  ['Lianenschlucht', 'Froschteich', 'Baumkronenpfad', 'Regenwald', 'Orchideental', 'Wasserfall', 'Sumpfbrücke', 'Affenpfad', 'Nachtdschungel', 'Tempelruine', 'Giftranke'],
  ['Dünenmeer', 'Oase', 'Kaktuspfad', 'Sandsturm', 'Skorpionhöhle', 'Ruinenstadt', 'Geierfelsen', 'Salzsee', 'Karawanenweg', 'Sonnenpyramide', 'Mondschein-Wüste', 'Treibsand'],
  ['Eiswiese', 'Pinguinbucht', 'Schneesturm', 'Kristallhöhle', 'Gletscherspalte', 'Tannenwald', 'Eisbrücke', 'Polarnacht', 'Frostpass', 'Iglu-Dorf', 'Lawinenhang', 'Eispalast-Tor', 'Nordlicht'],
  ['Felsenpfad', 'Steinbruch', 'Windpass', 'Adlerhorst', 'Höhlensystem', 'Hängebrücke', 'Gipfelstürmer', 'Geröllhalde', 'Donnerschlucht', 'Wolkensteg', 'Goldmine', 'Sturmgipfel', 'Gratwanderung', 'Himmelstreppe'],
  ['Aschefeld', 'Glutpfad', 'Magmasee', 'Feuerbrücke', 'Obsidianhöhle', 'Rauchtal', 'Schmelzofen', 'Funkenregen', 'Vulkanhang', 'Lavafall', 'Drachenzähne', 'Glutnacht', 'Kraterrand', 'Feuertor', 'Schlund des Verschlingers'],
  ['Wolkenwiese', 'Regenbogenbrücke', 'Windmühle', 'Sternenstaub-Pfad', 'Himmelstreppe', 'Gewitterwolke', 'Schäfchenwolken', 'Mondscheinterrasse', 'Nebelmeer', 'Sturmvogel-Horst', 'Sonnenaufgang', 'Silberlinie', 'Zwielichtbogen', 'Kometenschweif', 'Sternentor', 'Himmelsthron'],
];
const STYLES = ['plain', 'hills', 'gaps', 'sky', 'stairs', 'cave'];
const STYLE_TXT = { plain: '', hills: 'Hügelland', gaps: 'Viele Abgründe', sky: 'Schwebende Inseln', stairs: 'Treppenberg', cave: 'Enge Höhle' };
const MODS = [['springs', 'movers', 'crumble', 'rain'], ['springs', 'movers', 'crumble', 'dark'], ['wind', 'movers', 'crumble', 'boulders'],
  ['ice', 'wind', 'springs', 'dark'], ['wind', 'boulders', 'crumble', 'lowgrav'], ['fireballs', 'crumble', 'movers', 'boulders'], ['wind', 'lowgrav', 'springs', 'movers']];
const MOD_TXT = { springs: 'Sprungfedern', movers: 'Bewegliche Plattformen', crumble: 'Brüchige Planken', rain: 'Regen', dark: 'Dunkelheit – nur Lunas Licht', wind: 'Starker Wind',
  boulders: 'Steinschlag!', ice: 'Rutschiges Eis', lowgrav: 'Mond-Schwerkraft', fireballs: 'Feuerbälle aus der Tiefe' };
const WEATHER = ['leaves', 'rain', 'sand', 'snow', 'fog', 'embers', 'fog'];
const WORLD_OBJ = [['🌳', '🌲', '🌿', '🍄'], ['🌴', '🌿', '🌺', '🪵'], ['🌵', '🌴', '🏛️', '🪨'], ['🌲', '⛄', '🧊', '🏔️'], ['⛰️', '🏔️', '🪨', '🌲'], ['🌋', '🔥', '🪨', '💀'], ['☁️', '🌈', '⭐', '🪁']];
const PALS = [
  [{ top: '#7ed957', dirt: '#7a5230', hill: '#6cbf5a' }, { top: '#5fcf4a', dirt: '#5e4128', hill: '#4fb85a' }, { top: '#58c4a8', dirt: '#4a5a52', hill: '#3fa08a' }],
  [{ top: '#3fae4a', dirt: '#5b3b22', hill: '#2e9440' }, { top: '#2f8f6a', dirt: '#3b2f22', hill: '#1f7a55' }, { top: '#8bc34a', dirt: '#6a4a2a', hill: '#6aa33a' }],
  [{ top: '#e8c872', dirt: '#b58a46', hill: '#e0b25e' }, { top: '#e89a5a', dirt: '#a8602e', hill: '#d9824a' }, { top: '#f3e3b0', dirt: '#c9a86a', hill: '#ecd08a' }],
  [{ top: '#ffffff', dirt: '#8fa8bd', hill: '#d8e8f5' }, { top: '#e6f4ff', dirt: '#6f8fb0', hill: '#bcd8ee' }, { top: '#f4eaff', dirt: '#8a86b0', hill: '#d5cdee' }],
  [{ top: '#a9a9b5', dirt: '#6b6b78', hill: '#8c93aa' }, { top: '#b89b7a', dirt: '#6e5440', hill: '#a08468' }, { top: '#8fb08f', dirt: '#566656', hill: '#7a9a8a' }],
  [{ top: '#4a3a3a', dirt: '#2b1f1f', hill: '#7a2a1a' }, { top: '#5a4a3a', dirt: '#3a2a1f', hill: '#8a3a1a' }, { top: '#3a3a4a', dirt: '#1f1f2b', hill: '#5a2a3a' }],
  [{ top: '#ffffff', dirt: '#c4d6f4', hill: '#e0eaff' }, { top: '#fff0fa', dirt: '#d6c4f0', hill: '#f0e0ff' }, { top: '#e8f4ff', dirt: '#a8b8e8', hill: '#c8d8ff' }],
];
const PLAT = [['#9a6b3a', '#7ed957'], ['#7a9a3a', '#3fae4a'], ['#d9b46a', '#f1dca6'], ['#bfe4ff', '#ffffff'], ['#8a8a99', '#b9b9c8'], ['#3a2a2a', '#ff7a2a'], ['#c8d8f4', '#ffffff']];
// Gegner mit Eigenheiten: shoot = wirft Geschosse, spiky = Springen auf den Kopf tut weh (nur Nahkampf/Fernangriff)
Object.assign(W[1].enemies[1], { x: 'shoot', sh: '🥥' }); Object.assign(W[2].enemies[2], { x: 'spiky' });
Object.assign(W[3].enemies[0], { x: 'shoot', sh: '❄️' }); Object.assign(W[4].enemies[0], { x: 'spiky' });
Object.assign(W[5].enemies[1], { x: 'shoot', sh: '🔥' }); Object.assign(W[5].enemies[0], { x: 'spiky' });
Object.assign(W[6].enemies[1], { x: 'shoot', sh: '🌀' }); Object.assign(W[6].enemies[0], { x: 'spiky' });
// Neue Faehigkeiten im Mondbaum
SKILLS[0].list.push({ id: 'combo', n: 'Kombo', d: 'Schnelle Treffer +1 Schaden', max: 2, req: 'pow1' });
SKILLS[2].list.push({ id: 'dash', n: 'Mondsprint', d: 'Dash (💨-Taste)', max: 1, req: 'spd' }, { id: 'glide', n: 'Schwanz-Gleiter', d: 'Jump halten = gleiten', max: 1, req: 'jmp' }, { id: 'wall', n: 'Wandsprung', d: 'An Wänden abspringen', max: 1, req: 'jmp' });
const PIT = ['#3a8fd8', '#2a7a6a', '#c9a45a', '#7fb8e8', '#cfd6e6', '#ff5a1a', '#d8e6ff'];

// Jede Welt hat drei Akte (je ein Drittel der Level): eigener Name, Tageszeit, Palette und Kulissen-Objekte.
// So steigert sich eine Welt sichtbar vom hellen Anfang ueber die Daemmerung bis zur Nacht oder zum Sturm vor dem Boss.
const ACTS = [
  [{ n: 'Waldrand', k: ['day', 'dawn'] }, { n: 'Tiefer Wald', k: ['day', 'dusk'] }, { n: 'Wurzelreich', k: ['dusk', 'night'] }],
  [{ n: 'Flussufer', k: ['day', 'dawn'] }, { n: 'Blätterdach', k: ['day', 'dusk'] }, { n: 'Dunkles Herz', k: ['night', 'night'] }],
  [{ n: 'Dünenmeer', k: ['day', 'dawn'] }, { n: 'Ruinenstadt', k: ['day', 'dusk'] }, { n: 'Sonnenpyramide', k: ['dusk', 'night'] }],
  [{ n: 'Eisebene', k: ['day', 'dawn'] }, { n: 'Kristallwald', k: ['dusk', 'day'] }, { n: 'Polarnacht', k: ['night', 'storm'] }],
  [{ n: 'Bergpfad', k: ['day', 'dawn'] }, { n: 'Felswand', k: ['day', 'dusk'] }, { n: 'Sturmgipfel', k: ['storm', 'night'] }],
  [{ n: 'Aschefeld', k: ['dusk', 'dusk'] }, { n: 'Magmaadern', k: ['dusk', 'night'] }, { n: 'Schlund', k: ['night', 'storm'] }],
  [{ n: 'Wolkenwiese', k: ['day', 'dawn'] }, { n: 'Sternenbrücke', k: ['dusk', 'day'] }, { n: 'Himmelsthron', k: ['night', 'night'] }],
];
const actOf = (wi, li) => Math.min(2, Math.floor(li * 3 / W[wi].n));

const WX_TXT = { rain: 'Regen – leicht rutschig', sand: 'Sandwind schiebt dich', snow: 'Schnee bremst etwas', fog: 'Nebel – kurze Sicht' };
