// Spieldaten: Welten, Gegner, Bosse, Items, Skillbaum. Alles datengetrieben.
// Angriffstypen der Bosse (Reihenfolge in atk): high -> Block, low -> Sprung, magic -> Fokus
const W = [
  { name: 'Natur', emoji: '🌿', n: 10, sky: ['#8fd3ff', '#dff7cf'], top: '#7ed957', dirt: '#7a5230', hill: '#6cbf5a', ice: 0,
    enemies: [{ n: 'Pilzling', e: '🍄', hp: 2, b: 'walk', s: 50 }, { n: 'Hüpfkäfer', e: '🐞', hp: 2, b: 'hop', s: 55 }, { n: 'Biene', e: '🐝', hp: 1, b: 'fly', s: 60 }],
    mini: { n: 'Eichen-Wächter', e: '🌳', hp: 70, dmg: 5, atk: ['Wurzelhieb', 'Ast-Fegen', 'Pollenfluch'], bg: '#2f6b2f' },
    boss: { n: 'Wurzelkönig', e: '🌲', hp: 170, dmg: 7, atk: ['Stammschlag', 'Wurzelsense', 'Sporenregen'], bg: '#1f4d24' } },
  { name: 'Dschungel', emoji: '🌴', n: 11, sky: ['#6fd6a0', '#c7f0a0'], top: '#3fae4a', dirt: '#5b3b22', hill: '#2e9440', ice: 0,
    enemies: [{ n: 'Frosch', e: '🐸', hp: 2, b: 'hop', s: 60 }, { n: 'Affe', e: '🐒', hp: 3, b: 'walk', s: 75 }, { n: 'Papagei', e: '🦜', hp: 2, b: 'fly', s: 70 }],
    mini: { n: 'Lianen-Schlange', e: '🐍', hp: 100, dmg: 7, atk: ['Giftbiss', 'Schwanzpeitsche', 'Hypnose'], bg: '#17572f' },
    boss: { n: 'Dschungel-Titan', e: '🦍', hp: 250, dmg: 9, atk: ['Brusttrommler', 'Bodenbeben', 'Urschrei'], bg: '#0f3d22' } },
  { name: 'Wüste', emoji: '🏜️', n: 12, sky: ['#ffd98a', '#fff1c4'], top: '#e8c872', dirt: '#b58a46', hill: '#e0b25e', ice: 0,
    enemies: [{ n: 'Skorpion', e: '🦂', hp: 3, b: 'walk', s: 65 }, { n: 'Geier', e: '🦅', hp: 3, b: 'fly', s: 75 }, { n: 'Kaktussprung', e: '🌵', hp: 3, b: 'hop', s: 50 }],
    mini: { n: 'Sand-Skarabäus', e: '🪲', hp: 130, dmg: 9, atk: ['Panzerstoß', 'Sandsog', 'Sandsturm'], bg: '#8a5a1f' },
    boss: { n: 'Sandpharao', e: '🗿', hp: 330, dmg: 11, atk: ['Zepterhieb', 'Mumienfessel', 'Fluch der Wüste'], bg: '#6e4415' } },
  { name: 'Schnee', emoji: '❄️', n: 13, sky: ['#b9dcff', '#f4faff'], top: '#ffffff', dirt: '#8fa8bd', hill: '#d8e8f5', ice: 1,
    enemies: [{ n: 'Pinguin', e: '🐧', hp: 4, b: 'walk', s: 70 }, { n: 'Schneehase', e: '🐇', hp: 3, b: 'hop', s: 70 }, { n: 'Frostgeist', e: '👻', hp: 3, b: 'fly', s: 65 }],
    mini: { n: 'Mammut', e: '🦣', hp: 170, dmg: 11, atk: ['Stoßzahn', 'Trampeln', 'Eishauch'], bg: '#3d6a94' },
    boss: { n: 'Eiskönigin', e: '🧊', hp: 420, dmg: 13, atk: ['Eislanze', 'Kältewelle', 'Blizzard'], bg: '#27506f' } },
  { name: 'Berg', emoji: '⛰️', n: 14, sky: ['#9fb4d9', '#e4e8f2'], top: '#a9a9b5', dirt: '#6b6b78', hill: '#8c93aa', ice: 0,
    enemies: [{ n: 'Steinbock', e: '🐐', hp: 5, b: 'walk', s: 85 }, { n: 'Fledermaus', e: '🦇', hp: 3, b: 'fly', s: 85 }, { n: 'Felsbrocken', e: '🪨', hp: 6, b: 'hop', s: 45 }],
    mini: { n: 'Steingolem', e: '🤖', hp: 220, dmg: 13, atk: ['Felsfaust', 'Erdrutsch', 'Runenblitz'], bg: '#4a4a5a' },
    boss: { n: 'Donnervogel', e: '🦅', hp: 520, dmg: 15, atk: ['Krallenhieb', 'Flügelsturm', 'Blitzschlag'], bg: '#2d2d44' } },
  { name: 'Lava', emoji: '🌋', n: 15, sky: ['#5a1a1a', '#ff8a3d'], top: '#4a3a3a', dirt: '#2b1f1f', hill: '#7a2a1a', ice: 0,
    enemies: [{ n: 'Lavakrabbe', e: '🦀', hp: 6, b: 'walk', s: 80 }, { n: 'Feuergeist', e: '🔥', hp: 4, b: 'fly', s: 90 }, { n: 'Magma-Schleim', e: '🟠', hp: 7, b: 'hop', s: 60 }],
    mini: { n: 'Flammenwächter', e: '👹', hp: 300, dmg: 16, atk: ['Feuerfaust', 'Glutfeger', 'Aschenfluch'], bg: '#6e1d12' },
    boss: { n: 'Mondverschlinger', e: '🐲', hp: 800, dmg: 19, atk: ['Drachenklaue', 'Schwanzfeger', 'Inferno'], bg: '#3b0d0d' } },
  // Bonuswelt nach dem Ende: das Himmelreich ueber dem Mond
  { name: 'Himmel', emoji: '☁️', n: 16, sky: ['#7fb8ff', '#fff0fa'], top: '#ffffff', dirt: '#c4d6f4', hill: '#e6eeff', ice: 0,
    enemies: [{ n: 'Wolkenschaf', e: '🐑', hp: 8, b: 'walk', s: 75 }, { n: 'Windgeist', e: '🌬️', hp: 6, b: 'fly', s: 100 }, { n: 'Funkenhüpfer', e: '⚡', hp: 9, b: 'hop', s: 65 }],
    mini: { n: 'Wolken-Wächter', e: '🛡️', hp: 380, dmg: 19, atk: ['Lanzenstoß', 'Windschnitt', 'Blitzschild'], bg: '#4a6aa8' },
    boss: { n: 'Sternenwächter', e: '🦉', hp: 1000, dmg: 23, atk: ['Federsturm', 'Sternschnuppe', 'Mondlicht-Strahl'], bg: '#1a1e4a' } },
];

// fx: hp spd jmp xj dmg time shield mag shot regen s2 rev
const ITEMS = [
  { id: 'i00', w: 0, n: 'Eichel-Amulett', e: '🌰', d: '+1 Herz', fx: { hp: 1 } },
  { id: 'i01', w: 0, n: 'Blumenstiefel', e: '🥾', d: '+12% Tempo', fx: { spd: .12 } },
  { id: 'i02', w: 0, n: 'Honigtrank', e: '🍯', d: 'Heilt langsam', fx: { regen: 1 } },
  { id: 'i03', w: 0, n: 'Glückskäfer', e: '🍀', d: 'Doppelte Mondsplitter', fx: { s2: 1 } },
  { id: 'i10', w: 1, n: 'Lianenseil', e: '🪢', d: 'Doppelsprung', fx: { xj: 1 } },
  { id: 'i11', w: 1, n: 'Giftpfeile', e: '🏹', d: 'Fernangriff', fx: { shot: 1 } },
  { id: 'i12', w: 1, n: 'Affenkralle', e: '🐾', d: 'Magnet für Splitter', fx: { mag: 70 } },
  { id: 'i13', w: 1, n: 'Orchidee', e: '🌺', d: '+20s Zeit', fx: { time: 20 } },
  { id: 'i20', w: 2, n: 'Sandglas', e: '⏳', d: '+30s Zeit', fx: { time: 30 } },
  { id: 'i21', w: 2, n: 'Skarabäus-Siegel', e: '📿', d: 'Schutzschild', fx: { shield: 1 } },
  { id: 'i22', w: 2, n: 'Wasserschlauch', e: '🧴', d: 'Heilt langsam', fx: { regen: 1 } },
  { id: 'i23', w: 2, n: 'Sonnenklinge', e: '🗡️', d: '+1 Schaden', fx: { dmg: 1 } },
  { id: 'i30', w: 3, n: 'Eiskufen', e: '⛸️', d: '+20% Tempo', fx: { spd: .2 } },
  { id: 'i31', w: 3, n: 'Pelzmantel', e: '🧥', d: '+1 Herz, Schild', fx: { hp: 1, shield: 1 } },
  { id: 'i32', w: 3, n: 'Schneeball', e: '☃️', d: 'Fernangriff', fx: { shot: 1 } },
  { id: 'i33', w: 3, n: 'Frostkristall', e: '💎', d: '+1 Schaden', fx: { dmg: 1 } },
  { id: 'i40', w: 4, n: 'Kletterhaken', e: '🪝', d: 'Doppelsprung', fx: { xj: 1 } },
  { id: 'i41', w: 4, n: 'Steinhaut', e: '🛡️', d: 'Schild +1 Herz', fx: { shield: 1, hp: 1 } },
  { id: 'i42', w: 4, n: 'Adlerfeder', e: '🪶', d: '+15% Sprunghöhe', fx: { jmp: .15 } },
  { id: 'i43', w: 4, n: 'Bergbrecher', e: '🔨', d: '+2 Schaden', fx: { dmg: 2 } },
  { id: 'i50', w: 5, n: 'Feuerherz', e: '❤️‍🔥', d: '+2 Herzen', fx: { hp: 2 } },
  { id: 'i51', w: 5, n: 'Magmaklinge', e: '⚔️', d: '+2 Schaden', fx: { dmg: 2 } },
  { id: 'i52', w: 5, n: 'Aschenstiefel', e: '👢', d: '+25% Tempo', fx: { spd: .25 } },
  { id: 'i53', w: 5, n: 'Phönixfeder', e: '🔱', d: 'Wiederbelebung (1x)', fx: { rev: 1 } },
  { id: 'i60', w: 6, n: 'Wolkenschuhe', e: '👟', d: '+30% Tempo', fx: { spd: .3 } },
  { id: 'i61', w: 6, n: 'Sternenstaub', e: '✨', d: 'Doppelte Splitter, +25s', fx: { s2: 1, time: 25 } },
  { id: 'i62', w: 6, n: 'Windfeder', e: '🪽', d: 'Doppelsprung, höher', fx: { xj: 1, jmp: .1 } },
  { id: 'i63', w: 6, n: 'Himmelsschwert', e: '🗡️', d: '+3 Schaden', fx: { dmg: 3 } },
];
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// Boosts, die im Level mit der Zeit erscheinen und fuer den Rest des Levels wirken
const DROPS = [
  { e: '❤️', t: '+1 Herz', f: (r) => { r.p.hp = Math.min(r.p.hp + 1, r.S.maxhp + r.boost.hp); } },
  { e: '💖', t: '+1 Max-Herz', f: (r) => { r.boost.hp++; r.p.hp++; } },
  { e: '⚔️', t: '+1 Schaden', f: (r) => { r.boost.dmg++; } },
  { e: '⚡', t: 'Schneller', f: (r) => { r.boost.spd += .1; } },
  { e: '🦘', t: 'Höher springen', f: (r) => { r.boost.jmp += .07; } },
  { e: '⏱️', t: '+12s Zeit', f: (r) => { r.time += 12; } },
  { e: '🛡️', t: 'Schild', f: (r) => { r.p.sh++; } },
];

// Skillbaum: Kosten pro Rang = Rangnummer. req = Vorgaenger muss Rang >= 1 haben
const SKILLS = [
  { b: 'Kraft', list: [
    { id: 'pow1', n: 'Mondklinge', d: '+1 Schaden', max: 3 },
    { id: 'crit', n: 'Treffsicher', d: '+10% Krit', max: 3, req: 'pow1' },
    { id: 'fire', n: 'Mondwurf', d: 'Fernangriff', max: 1, req: 'pow1' }] },
  { b: 'Leben', list: [
    { id: 'hp1', n: 'Zähes Herz', d: '+1 Herz', max: 3 },
    { id: 'shd', n: 'Mondschild', d: 'Start-Schild', max: 2, req: 'hp1' },
    { id: 'reg', n: 'Erholung', d: 'Regeneration', max: 2, req: 'hp1' }] },
  { b: 'Wind', list: [
    { id: 'spd', n: 'Flinke Pfoten', d: '+8% Tempo', max: 3 },
    { id: 'jmp', n: 'Sprungkraft', d: '+6% Sprung', max: 3, req: 'spd' },
    { id: 'xj', n: 'Doppelsprung', d: 'Extra-Sprung', max: 1, req: 'jmp' }] },
  { b: 'Zeit', list: [
    { id: 'tm1', n: 'Sanduhr', d: '+10s pro Level', max: 3 },
    { id: 'tm2', n: 'Zeitraub', d: 'Kills +2s', max: 2, req: 'tm1' },
    { id: 'mag', n: 'Mondsog', d: 'Magnet', max: 2, req: 'tm1' }] },
];

// ---------- Story ----------
// w: luna | chey | narr | boss (e = Emoji des Sprechers)
const STORY = {
  intro: [
    { w: 'narr', t: 'Am Mondsee lebten zwei beste Freunde: Luna, die weiße Mondkatze, und Chey. Jede Vollmondnacht saßen die beiden am Ufer und sahen dem Mond beim Leuchten zu.' },
    { w: 'narr', t: 'Doch in dieser Nacht wurde der Himmel schwarz. Der Mondverschlinger stieg aus seinem Vulkan, schluckte den Mond – und zerbrach ihn in tausend Mondsplitter, die über das ganze Land fielen.' },
    { w: 'chey', t: 'Luna! Hilf mir!' },
    { w: 'boss', e: '🐲', t: 'Der Mond gehört jetzt mir. Und Chey nehme ich mit in meinen Vulkan!' },
    { w: 'luna', t: 'Chey! Ich hole dich zurück – und wenn ich durch sechs Länder laufen muss!' },
    { w: 'narr', t: 'Die Mondsplitter geben Luna Kraft. Sammle sie, werde stärker und folge der Spur bis zum Vulkan.' },
  ],
  world: [
    [{ w: 'luna', t: 'Hier im Grünen Tal beginnt die Spur. Aber die Wurzeln bewegen sich… Der Wächter des Waldes lauert in der Mitte des Weges.' }],
    [{ w: 'luna', t: 'Cheys Spur führt tief in den Dschungel. Alles ist dicht, laut und voller Schlangen. Ich muss weiter!' }],
    [{ w: 'luna', t: 'Heiß und endlos. Da liegt Cheys Glöckchen im Sand – wir sind richtig!' }],
    [{ w: 'luna', t: 'Brr, eisiger Wind. Die Pfotenspuren des Drachen führen hoch ins weiße Land.' }],
    [{ w: 'luna', t: 'Der Pass ist steil. Von hier oben sehe ich schon den Vulkan glühen. Halte durch, Chey!' }],
    [{ w: 'chey', t: 'Luna?! Ich höre dich! Ich bin im Käfig ganz oben im Vulkan!' }, { w: 'luna', t: 'Ich komme, Chey. Nichts hält mich mehr auf!' }],
    [{ w: 'narr', t: 'Nach dem Sieg öffnet sich über dem Mond ein Pfad aus Licht: das Himmelreich. Dort fallen die Sterne vom Himmel.' }, { w: 'luna', t: 'Chey, Minsch – wollen wir sehen, was da oben los ist?' }],
  ],
  mini: [
    [{ w: 'boss', e: '🌳', t: 'Ein Drache flog über den Wald… mit einem kleinen Schatten in den Krallen. Er hielt auf den Dschungel zu.' }],
    [{ w: 'boss', e: '🐍', t: 'Ssso, du suchst ihn. Der Drache ruhte in der Wüste. Geh nur, geh…' }],
    [{ w: 'boss', e: '🪲', t: 'Dein Freund hat nach dir gerufen, als der Drache vorbeiflog. Weiter nach Norden, ins Eis!' }],
    [{ w: 'boss', e: '🦣', t: 'Der Drache mied das Eis und flog zu den Bergen. Dort ist der Weg zum Feuer.' }],
    [{ w: 'boss', e: '🤖', t: 'Hinter diesem Pass beginnt das Reich aus Feuer. Kein Wesen kehrt von dort zurück…' }],
    [{ w: 'boss', e: '👹', t: 'Nur noch der Mondverschlinger steht zwischen dir und Chey. Geh, wenn du dich traust.' }],
    [{ w: 'boss', e: '🛡️', t: 'Nur wer die Wolkenbrücke bezwingt, darf zu den Sternen. Zeig, dass du fliegen kannst!' }],
  ],
  boss: [
    [{ w: 'boss', e: '🌲', t: 'Nimm die Mondsplitter, die ich verwahrte. Der Weg zum Dschungel ist frei.' }, { w: 'luna', t: 'Danke. Chey, ich komme!' }],
    [{ w: 'boss', e: '🦍', t: 'Du bist stark, kleine Katze. Geh durch die Wüste – dort fand der Drache seine Rast.' }],
    [{ w: 'boss', e: '🗿', t: 'Der Sand hat dich geprüft. Das Eisland liegt im Norden.' }],
    [{ w: 'boss', e: '🧊', t: 'Das Eis zerbricht… Die Berge warten auf dich. Nimm dich vor dem Donnervogel in Acht.' }],
    [{ w: 'boss', e: '🦅', t: 'Der Himmel gehört dir. Dahinter liegt nur noch Feuer – und der Mondverschlinger.' }],
    [],
    [{ w: 'boss', e: '🦉', t: 'Du hast die Sterne bestanden. Der Himmel ist jetzt dein Zuhause, Mondkatze.' }, { w: 'narr', t: 'Das Himmelreich ist befreit – die Sterne leuchten wieder, heller als je zuvor.' }],
  ],
  end: [
    { w: 'luna', t: 'Es ist vorbei, Verschlinger! Gib den Mond zurück!' },
    { w: 'narr', t: 'Der Mondverschlinger zerfiel zu Asche. Die Mondsplitter stiegen in den Himmel auf und fügten sich wieder zu einem strahlenden Mond zusammen.' },
    { w: 'chey', t: 'Luna! Ich wusste, dass du kommst!' },
    { w: 'luna', t: 'Natürlich. Gehen wir nach Hause?' },
    { w: 'chey', t: 'Nach Hause. Zum Mondsee.' },
    { w: 'narr', t: 'ENDE – Luna und Chey sind wieder vereint. Du kannst weiter Level wiederholen und alle Mondsplitter, Items und Fähigkeiten sammeln.' },
  ],
  say: [
    { mini: 'Keine Katze kommt an meinen Wurzeln vorbei!', boss: 'Der Mond ist weg, kleine Katze – und bald auch deine Hoffnung!' },
    { mini: 'Ssssss! Ich fessle dich mit meinen Lianen!', boss: 'Dieser Dschungel gehört mir! Brüll!' },
    { mini: 'Der Sand verschluckt jeden Eindringling.', boss: 'Dein Freund ist längst im Feuer verloren!' },
    { mini: 'Wer meinen Schnee betritt, friert fest.', boss: 'Erstarre im ewigen Eis!' },
    { mini: 'Meine Fäuste sind aus Fels!', boss: 'Der Sturm trägt dich davon!' },
    { mini: 'Das Feuer wird dich verzehren!', boss: 'Ich habe den Mond verschlungen – jetzt verschlinge ich dich!' },
    { mini: 'Kein Wesen ohne Flügel kommt hier vorbei!', boss: 'Die Sterne gehören mir. Zeig, was du kannst!' },
  ],
};

// ---------- Laeden (2 pro Welt) ----------
const SHOPS = [
  [{ n: 'Pilz-Laden', o: '🐿️' }, { n: 'Honig-Stand', o: '🐻' }],
  [{ n: 'Lianen-Basar', o: '🦜' }, { n: 'Orchideen-Hütte', o: '🐒' }],
  [{ n: 'Oasen-Stand', o: '🐪' }, { n: 'Karawanen-Zelt', o: '🦂' }],
  [{ n: 'Eis-Kiosk', o: '🐧' }, { n: 'Pelz-Laden', o: '🦭' }],
  [{ n: 'Gipfel-Hütte', o: '🐐' }, { n: 'Steinmetz', o: '🦅' }],
  [{ n: 'Glut-Schmiede', o: '🦀' }, { n: 'Asche-Markt', o: '🔥' }],
  [{ n: 'Wolken-Café', o: '🕊️' }, { n: 'Sternen-Markt', o: '🦉' }],
];
const CONS = [
  { id: 'heart', e: '🍪', n: 'Herzkeks', d: '+1 Herz im nächsten Level', p: 15 },
  { id: 'time', e: '⏰', n: 'Zeitkeks', d: '+20s im nächsten Level', p: 20 },
  { id: 'shield', e: '🛡️', n: 'Schild-Bonbon', d: 'Schild im nächsten Level', p: 25 },
  { id: 'tonic', e: '🧪', n: 'Mondtrank', d: 'Heilt 50% im Bosskampf', p: 30 },
];
