/* ============================================================
   DEEPVEIN — an idle mining saga
   Economy, scaling and prestige faithfully copied from
   Orteil's Cookie Clicker (v2 numbers):
     · building base costs/CPS = Cookie Clicker's 16 buildings
     · price ramp ×1.15 per owned, sell-back 25%
     · doubling upgrades at 1/5/25/50/100/150/200 owned
     · golden events: Frenzy ×7 (77s), Lucky, Click Frenzy ×777 (13s)
     · prestige level = floor( cbrt( forfeited / 1e12 ) ),
       +1% CPS per level, heavenly-chip-style "diamonds"
   ============================================================ */
"use strict";

/* ---------------------------- DATA ---------------------------- */

const SPRITE = id => `assets/sprites/${id}.svg`;

// Base costs & CPS are Cookie Clicker's, verbatim (Cursor → Fractal engine).
const BUILDINGS = [
  { id:"pickaxe",          name:"Pickaxe",          plural:"Pickaxes",          baseCost:15,     baseCps:0.1,
    desc:"Swings itself at the face, forever. Chips off ore.",
    quote:"A miner's first friend and last possession." },
  { id:"prospector",       name:"Prospector",       plural:"Prospectors",       baseCost:100,    baseCps:1,
    desc:"A grizzled old-timer to sniff out ore for you.",
    quote:"Says she can smell gold through forty feet of granite. She can." },
  { id:"panning-camp",     name:"Panning Camp",     plural:"Panning Camps",     baseCost:1100,   baseCps:8,
    desc:"Sifts the riverbed for glittering dust.",
    quote:"Cold water, aching knees, and every so often — a gleam." },
  { id:"ore-cart",         name:"Ore Cart",         plural:"Ore Carts",         baseCost:12000,  baseCps:47,
    desc:"Rattles along its rails hauling ore up from below.",
    quote:"Mind the runaway ones. They mind nobody." },
  { id:"quarry",           name:"Quarry",           plural:"Quarries",          baseCost:130000, baseCps:260,
    desc:"An open wound in the hillside, bleeding stone and ore.",
    quote:"The hill was in the way of the ore. The hill lost." },
  { id:"mine-shaft",       name:"Mine Shaft",       plural:"Mine Shafts",       baseCost:1.4e6,  baseCps:1400,
    desc:"Timbered galleries sunk deep into the dark.",
    quote:"Every lantern down there is a small defiance." },
  { id:"smelter",          name:"Smelter",          plural:"Smelters",          baseCost:2e7,    baseCps:7800,
    desc:"Roars day and night, pouring rivers of bright metal.",
    quote:"The night shift says the slag whispers. The day shift wears earplugs." },
  { id:"refinery",         name:"Refinery",         plural:"Refineries",        baseCost:3.3e8,  baseCps:44000,
    desc:"Distills raw rock into impossibly pure lodes.",
    quote:"Ninety-nine point nine percent pure. The last tenth is spite." },
  { id:"railway",          name:"Railway",          plural:"Railways",          baseCost:5.1e9,  baseCps:260000,
    desc:"A private iron road hauling whole mountains to market.",
    quote:"On time, every time, or the foreman eats his hat. He has eaten two." },
  { id:"crystal-cavern",   name:"Crystal Cavern",   plural:"Crystal Caverns",   baseCost:7.5e10, baseCps:1.6e6,
    desc:"A geode the size of a cathedral, harvested gently.",
    quote:"Take off your helmet in there. It's only polite." },
  { id:"geothermal-bore",  name:"Geothermal Bore",  plural:"Geothermal Bores",  baseCost:1e12,   baseCps:1e7,
    desc:"Drills past bedrock and taps the planet's own furnace.",
    quote:"The Earth was asked politely. Repeatedly. With diamond bits." },
  { id:"magma-forge",      name:"Magma Forge",      plural:"Magma Forges",      baseCost:1.4e13, baseCps:6.5e7,
    desc:"Casts ingots directly from the molten underworld.",
    quote:"Standard-issue tongs are forty feet long, and still too short." },
  { id:"tectonic-rig",     name:"Tectonic Rig",     plural:"Tectonic Rigs",     baseCost:1.7e14, baseCps:4.3e8,
    desc:"Pries fault lines apart to loot the seams between plates.",
    quote:"The earthquakes are scheduled. Mostly." },
  { id:"mantle-elevator",  name:"Mantle Elevator",  plural:"Mantle Elevators",  baseCost:2.1e15, baseCps:2.9e9,
    desc:"A pressurized lift running clean down to the mantle.",
    quote:"Please keep hands, feet and souls inside the car at all times." },
  { id:"core-tap",         name:"Core Tap",         plural:"Core Taps",         baseCost:2.6e16, baseCps:2.1e10,
    desc:"Siphons riches straight from the planet's iron heart.",
    quote:"The core is 80% iron and 20% none of your business." },
  { id:"singularity-drill",name:"Singularity Drill",plural:"Singularity Drills",baseCost:3.1e17, baseCps:1.5e11,
    desc:"Mines ore from folded space where mountains used to be.",
    quote:"It doesn't dig down anymore. It digs *through*." },
];

const B_INDEX = {}; BUILDINGS.forEach((b,i)=>B_INDEX[b.id]=i);

// Cookie Clicker tier pattern: unlocked at N owned, cost = base × mult, each doubles the building.
const TIER_AT   = [1, 5, 25, 50, 100, 150, 200];
const TIER_MULT = [10, 50, 500, 50000, 5e6, 5e8, 5e10];
const TIER_TAG  = ["I","II","III","IV","V","VI","VII"];

const TIER_NAMES = {
  "pickaxe":          null, // special-cased below
  "prospector":       ["Stronger Coffee","Steel Toe Boots","Lucky Hat","Second Wind Tonic","Bifocal Loupes","Mule Team","Living Legend"],
  "panning-camp":     ["Wider Pans","Sluice Boxes","Mercury-Free Magnets","Dredge Barges","River Rerouting","Gold-Scent Hounds","Alluvial Alchemy"],
  "ore-cart":         ["Greased Axles","Steel Rails","Gravity Assist","Double-Deck Carts","Pneumatic Brakes","Self-Loading Hoppers","Ghost-Driven Carts"],
  "quarry":           ["Better Blasting","Terraced Cuts","Steam Shovels","Diamond Saws","Controlled Avalanche","Strip-Mining Charters","Mountain Amnesty"],
  "mine-shaft":       ["Deeper Timbers","Canary Unions","Steam Hoists","Electric Lighting","Pressurized Levels","Echo Mapping","Bottomless Writ"],
  "smelter":          ["Hotter Coke","Bessemer Vats","Slag Recycling","Induction Coils","Dragonfire Contracts","Zero-Loss Crucibles","Star-Metal Alloys"],
  "refinery":         ["Finer Filters","Centrifugal Purity","Acid Leaching","Molecular Sieves","Isotope Sorting","Perfection Quotas","The 100th Decimal"],
  "railway":          ["Heavier Gauge","Night Freight","Switchyard Logic","Armored Bullion Cars","Transcontinental Lines","Maglev Ore Trains","The Endless Timetable"],
  "crystal-cavern":   ["Velvet Gloves","Resonance Picks","Songline Surveys","Prism Cultivation","Geode Grafting","Choir of Facets","The Great Chandelier"],
  "geothermal-bore":  ["Tungsten Bits","Casing Coolant","Magma-Proof Seals","Self-Sharpening Heads","Twin-Bore Arrays","Pressure Harvesting","Hollow Planet Theory"],
  "magma-forge":      ["Longer Tongs","Obsidian Molds","Convection Control","Salamander Wranglers","Caldera Annexes","Tectonic Bellows","Forge of the First Fire"],
  "tectonic-rig":     ["Fault Lubricant","Seismic Timing","Plate Anchors","Continental Leverage","Subduction Rights","Richter Insurance","The Slow Earthquake"],
  "mantle-elevator":  ["Reinforced Cables","Express Service","Heat-Shielded Cars","Peridotite Platforms","Mantle Plume Surfing","Olivine Concourse","Door-to-Core Service"],
  "core-tap":         ["Wider Siphons","Magnetic Funnels","Inner-Core Access","Geodynamo Rights","Iron Rain Collectors","Core Consortium","Heartsblood of the World"],
  "singularity-drill":["Event Horizon Polish","Folded-Space Maps","Non-Euclidean Bits","Paradox Dampeners","Recursive Lodes","Infinite Regress Mining","The Last Stratum"],
};

const TIER_GLYPHS = ["⛏️","🧭","🥇","🛤️","🧨","🪜","🔥","⚗️","🚂","💎","🌋","🔨","🌍","🛗","🧲","🌀"];

/* Pickaxe (cursor) line — Cookie Clicker's cursor upgrades, verbatim structure. */
const PICKAXE_UPGRADES = [
  { id:"pick-1", name:"Reinforced Handles", cost:100,  at:1,   kind:"pickDouble",
    desc:"Pickaxes and clicking are <b>twice</b> as efficient.", quote:"Hickory. Accept no substitutes." },
  { id:"pick-2", name:"Tempered Heads",     cost:500,  at:1,   kind:"pickDouble",
    desc:"Pickaxes and clicking are <b>twice</b> as efficient.", quote:"Quenched in the coldest creek in the county." },
  { id:"pick-3", name:"Thousand Sparks",    cost:1e4,  at:10,  kind:"fingers",
    desc:"Pickaxes and clicking gain <b>+0.1</b> ore for every non-pickaxe holding.", quote:"Each spark knows where it's going." },
  { id:"pick-4", name:"Million Sparks",     cost:1e5,  at:25,  kind:"fingersX", mult:5,
    desc:"Multiplies the gain from Thousand Sparks by <b>5</b>.", quote:"The night shift stopped needing lanterns." },
  { id:"pick-5", name:"Billion Sparks",     cost:1e7,  at:50,  kind:"fingersX", mult:10,
    desc:"Multiplies the gain from Thousand Sparks by <b>10</b>.", quote:"Locals report a second sunrise, underground." },
  { id:"pick-6", name:"Trillion Sparks",    cost:1e8,  at:100, kind:"fingersX", mult:20,
    desc:"Multiplies the gain from Thousand Sparks by <b>20</b>.", quote:"The sparks have begun holding meetings." },
  { id:"pick-7", name:"Quadrillion Sparks", cost:1e9,  at:150, kind:"fingersX", mult:20,
    desc:"Multiplies the gain from Thousand Sparks by <b>20</b>.", quote:"Astronomy departments file weekly complaints." },
  { id:"pick-8", name:"Quintillion Sparks", cost:1e10, at:200, kind:"fingersX", mult:20,
    desc:"Multiplies the gain from Thousand Sparks by <b>20</b>.", quote:"The mine now glows from orbit." },
];

/* Click upgrades — Cookie Clicker's mouse line: clicking gains +1% of CPS each. */
const CLICK_UPGRADES = [
  { id:"click-1", name:"Lodestone Chisel",    cost:5e4,   handmade:1e3,  glyph:"🪨" },
  { id:"click-2", name:"Dowsing Rod",         cost:5e6,   handmade:1e5,  glyph:"🥢" },
  { id:"click-3", name:"Miner's Sixth Sense", cost:5e8,   handmade:1e7,  glyph:"👁️" },
  { id:"click-4", name:"Resonant Swing",      cost:5e10,  handmade:1e9,  glyph:"〰️" },
  { id:"click-5", name:"Seismic Follow-Through", cost:5e12, handmade:1e11, glyph:"💥" },
  { id:"click-6", name:"One With The Rock",   cost:5e14,  handmade:1e13, glyph:"🧘" },
].map(u => ({ ...u, kind:"clickPct",
  desc:"Clicking gains <b>+1%</b> of your ore per second.",
  quote:"Strike where the mountain isn't looking." }));

/* Canaries — Cookie Clicker's kittens. Morale (milk) = 4% per feat. */
const CANARY_UPGRADES = [
  { id:"canary-1", name:"Canary Helpers",   cost:9e6,  feats:15, factor:0.1,   glyph:"🐤" },
  { id:"canary-2", name:"Canary Workers",   cost:9e9,  feats:30, factor:0.125, glyph:"🐥" },
  { id:"canary-3", name:"Canary Engineers", cost:9e13, feats:45, factor:0.15,  glyph:"🐦" },
  { id:"canary-4", name:"Canary Overseers", cost:9e17, feats:60, factor:0.2,   glyph:"🦜" },
].map(u => ({ ...u, kind:"canary",
  desc:"You gain <b>more ore</b> the higher your canary morale.",
  quote:"They stopped warning about gas years ago. Now they manage." }));

/* Vein flavors — Cookie Clicker's flavored cookies: flat % multipliers. */
const FLAVOR_UPGRADES = [
  { id:"flav-1",  name:"Copper Glints",      cost:999,    earned:0,     pct:1,  glyph:"🟠" },
  { id:"flav-2",  name:"Tin Whiskers",       cost:9999,   earned:5e4,   pct:1,  glyph:"🥫" },
  { id:"flav-3",  name:"Iron Freckles",      cost:99999,  earned:5e5,   pct:2,  glyph:"⚙️" },
  { id:"flav-4",  name:"Silver Threads",     cost:999999, earned:5e6,   pct:2,  glyph:"🥈" },
  { id:"flav-5",  name:"Gold Marbling",      cost:9999999,earned:5e7,   pct:5,  glyph:"🥇" },
  { id:"flav-6",  name:"Electrum Ribbons",   cost:9.99e8, earned:5e9,   pct:5,  glyph:"🎗️" },
  { id:"flav-7",  name:"Platinum Frost",     cost:9.99e10,earned:5e11,  pct:5,  glyph:"❄️" },
  { id:"flav-8",  name:"Iridium Roots",      cost:9.99e12,earned:5e13,  pct:5,  glyph:"🌿" },
  { id:"flav-9",  name:"Adamant Marrow",     cost:9.99e14,earned:5e15,  pct:5,  glyph:"🦴" },
  { id:"flav-10", name:"Orichalcum Dreams",  cost:9.99e16,earned:5e17,  pct:5,  glyph:"💭" },
].map(u => ({ ...u, kind:"flavor",
  desc:`Ore production multiplier <b>+${u.pct ?? ""}%</b>.`,
  quote:"The deeper veins taste different, say the old hands. Don't lick the veins." }));
FLAVOR_UPGRADES.forEach(u => u.desc = `Ore production multiplier <b>+${u.pct}%</b>.`);

/* Golden nugget upgrades — Cookie Clicker's Lucky day / Serendipity / Get lucky. */
const NUGGET_UPGRADES = [
  { id:"nug-1", name:"Lucky Strike",  cost:7.77e8,  nuggets:7,  kind:"nugFreq", glyph:"🍀",
    desc:"Golden nuggets appear <b>twice as often</b> and stay 5% longer.",
    quote:"Found it on the one day he forgot to look." },
  { id:"nug-2", name:"Serendipity",   cost:7.77e10, nuggets:27, kind:"nugFreq", glyph:"✨",
    desc:"Golden nuggets appear <b>twice as often</b> and stay 5% longer.",
    quote:"Twice the luck, same old boots." },
  { id:"nug-3", name:"Strike It Rich",cost:7.77e13, nuggets:77, kind:"nugDur",  glyph:"🌟",
    desc:"Golden nugget effects last <b>twice as long</b>.",
    quote:"The vein doesn't end. You just stop digging." },
];

/* Vault relics — heavenly upgrades. Diamond costs follow CC's heavenly chain. */
const RELICS = [
  { id:"relic-legacy", name:"Deep Legacy", cost:1, req:null, glyph:"🏛️",
    desc:"Unlocks the prestige bonus chain. Required by every other relic.",
    quote:"The first shaft your family ever sank. It remembers you." },
  { id:"relic-5",   name:"Whispers of the Vein",  cost:11,      req:"relic-legacy", frac:0.05, glyph:"🗣️",
    desc:"Your prestige levels are <b>5%</b> effective (+0.05% CPS per level)." },
  { id:"relic-25",  name:"Charts of the Underway",cost:1111,    req:"relic-5",   frac:0.25, glyph:"🗺️",
    desc:"Your prestige levels are <b>25%</b> effective." },
  { id:"relic-50",  name:"The Foreman's Ledger",  cost:111111,  req:"relic-25",  frac:0.5,  glyph:"📔",
    desc:"Your prestige levels are <b>50%</b> effective." },
  { id:"relic-75",  name:"Songs of the Deep",     cost:1111111, req:"relic-50",  frac:0.75, glyph:"🎶",
    desc:"Your prestige levels are <b>75%</b> effective." },
  { id:"relic-100", name:"Heart of the Mountain", cost:1,       req:"relic-75",  frac:1,    glyph:"❤️‍🔥",
    desc:"Your prestige levels are <b>100%</b> effective.",
    quote:"It was beating this whole time." },
  { id:"relic-toolbag", name:"The Old Toolbag", cost:50, req:"relic-legacy", glyph:"🎒",
    desc:"Begin every new claim with <b>10 pickaxes</b>." },
  { id:"relic-foreman", name:"Foreman's Favor", cost:5000, req:"relic-toolbag", glyph:"🤝",
    desc:"Begin every new claim with <b>5 prospectors</b>." },
  { id:"relic-charm", name:"Nugget Charm", cost:777, req:"relic-legacy", glyph:"🧿",
    desc:"Golden nuggets appear <b>10% more often</b>." },
  { id:"relic-idol",  name:"Nugget Idol",  cost:77777, req:"relic-charm", glyph:"🗿",
    desc:"Golden nugget effects last <b>10% longer</b>." },
  { id:"relic-seraph", name:"Seraph Canaries", cost:9999, req:"relic-legacy", glyph:"👼",
    desc:"Canary morale is <b>10% more effective</b>." },
];

/* Strata — the hero boulder evolves as this run's haul grows. */
const STRATA = [
  { at:0,    name:"Topsoil",          rock:["#8a8177","#625a51","#453e37","#2e2925"], vein:["#ffe9a8","#d9a441","#8a5f1d"], gem:["#fff3c4","#ffd76b","#a07018"] },
  { at:1e5,  name:"Shale Beds",       rock:["#7d7a82","#565460","#3b3a44","#26252e"], vein:["#e8f0ff","#9fb6d9","#5a6e8f"], gem:["#e6f2ff","#9cc3ff","#4a6ea0"] },
  { at:1e7,  name:"Copperreach",      rock:["#8a6a55","#63483a","#452f26","#2c1e18"], vein:["#ffd9b8","#e08a4d","#8f4d1f"], gem:["#d8fff2","#3ecf8e","#1b7a52"] },
  { at:1e9,  name:"Iron Deeps",       rock:["#6e6a6a","#4a4749","#333134","#211f22"], vein:["#ffc9b0","#c96f4a","#7a3a20"], gem:["#ffe1e6","#ff5d73","#99303f"] },
  { at:1e11, name:"Silver Hollows",   rock:["#9aa0a8","#6b7178","#484d54","#2e3237"], vein:["#ffffff","#cfd8e3","#7e8894"], gem:["#f0f6ff","#aac6e8","#5a7799"] },
  { at:1e13, name:"Gold Heart",       rock:["#8f7a55","#665338","#463825","#2c2317"], vein:["#fff3c4","#ffd76b","#a07018"], gem:["#fffbe8","#ffe9a8","#b8862a"] },
  { at:1e15, name:"Crystal Wound",    rock:["#7b6f8f","#544a66","#3a3348","#252030"], vein:["#f0e0ff","#b07cff","#6a3fb0"], gem:["#faf0ff","#d4b0ff","#8a5fd0"] },
  { at:1e17, name:"Magma Court",      rock:["#6e4a44","#4c2f2a","#35201c","#221310"], vein:["#ffe0b0","#ff7847","#a03818"], gem:["#fff0d8","#ffb545","#b05e15"] },
  { at:1e19, name:"The Singing Dark", rock:["#4a4a5e","#33334a","#222236","#151525"], vein:["#e0fbff","#7de8ff","#2a7f99"], gem:["#ffffff","#c4f4ff","#5aa8c4"] },
];

const NEWS = [
  () => `a local prospector claims the big rock "looked at me funny." Foreman unconcerned.`,
  () => `ore prices steady. Shovel prices scandalous.`,
  () => `miner's almanac predicts: dark underground today, with patches of glitter.`,
  () => `"just one more swing," says miner entering hour nineteen of shift.`,
  () => `union of canaries demands smaller cages, bigger sunflower seeds.`,
  () => `geologists confirm: rocks remain extremely old.`,
  () => `sinkhole opens beneath town hall; mayor praises "free excavation."`,
  () => `today's safety tip: the pointy end of the pickaxe goes in the rock.`,
  () => `local man mistakes pyrite for gold, refuses to hear otherwise, elected mayor.`,
  () => `deep-shaft crews report faint singing from below. Management calls it "morale."`,
  () => `new mine cart speed record set; record-holder recovering nicely.`,
  () => `dynamite shipment arrives labeled "candles." Post office apologizes.`,
  () => `archaeologists find ancient pickaxe; it still out-swings the new ones.`,
  () => `astronomers complain the mine now visible from space. Miners wave.`,
  () => `the mountain moved three inches overnight. Nobody mentions it at breakfast.`,
  g => g.buildings["prospector"].owned > 0 ? `prospectors agree: "the vein goes deeper." Prospectors always agree on this.` : null,
  g => g.buildings["prospector"].owned >= 25 ? `prospector council convenes; agenda leaked: "dig," "keep digging," misc.` : null,
  g => g.buildings["smelter"].owned > 0 ? `smelter shift produces record ingots; slag heap achieves minor sentience, unionizes.` : null,
  g => g.buildings["railway"].owned > 0 ? `ore express derails into bullion depot; insurers call it "a wash."` : null,
  g => g.buildings["crystal-cavern"].owned > 0 ? `crystal cavern choir books world tour; refuses to leave cavern. World comes to them.` : null,
  g => g.buildings["geothermal-bore"].owned > 0 ? `planet's core files noise complaint. Drilling continues out of spite.` : null,
  g => g.buildings["core-tap"].owned > 0 ? `the planet's core is now 4% straw, geophysicists report nervously.` : null,
  g => g.buildings["singularity-drill"].owned > 0 ? `space folds neatly now. Mountains file for restraining orders.` : null,
  g => g.prestigeLevel > 0 ? `old-timers speak of the ones who Descended. Then they spit, respectfully.` : null,
  g => g.nuggetsClicked > 0 ? `golden nugget sightings up ${7 + (g.nuggetsClicked*13)%90}%. Ophthalmologists thrilled.` : null,
  g => g.cpsNow > 1e6 ? `economists warn ore-based economy "extremely based."` : null,
  g => g.cpsNow > 1e9 ? `world's oceans now 2% ore dust. Beaches sparkle menacingly.` : null,
];

const FMT_NAMES = ["million","billion","trillion","quadrillion","quintillion","sextillion",
  "septillion","octillion","nonillion","decillion","undecillion","duodecillion","tredecillion",
  "quattuordecillion","quindecillion","sexdecillion","septendecillion","octodecillion","novemdecillion"];

/* ---------------------------- STATE ---------------------------- */

const SAVE_KEY = "deepvein-save-v1";

let G; // game state

function freshRun() {
  const buildings = {};
  BUILDINGS.forEach(b => buildings[b.id] = { owned: 0 });
  return {
    ore: 0,
    totalEarned: 0,       // this run
    handmade: 0,
    clicks: 0,
    buildings,
    upgrades: {},         // id -> true
    buffs: [],            // {type,name,mult,left,total}
  };
}

function freshGame() {
  return {
    ...freshRun(),
    allTimeEarned: 0,
    totalForfeited: 0,    // ore abandoned via Descend — drives prestige, CC-style
    diamonds: 0,
    diamondsSpent: 0,
    ascensions: 0,
    nuggetsClicked: 0,
    feats: {},            // id -> true
    relics: {},           // id -> true
    sound: true,
    started: Date.now(),
    cpsNow: 0,
    prestigeLevel: 0,
  };
}

/* ------------------------- MATH (CC-faithful) ------------------------- */

const PRICE_RAMP = 1.15;

function buildingPrice(b, owned) {
  return Math.ceil(b.baseCost * Math.pow(PRICE_RAMP, owned));
}
function bulkPrice(b, owned, n) {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buildingPrice(b, owned + i);
  return sum;
}
function bulkSellValue(b, owned, n) {
  let sum = 0;
  for (let i = 0; i < n && owned - 1 - i >= 0; i++) {
    sum += buildingPrice(b, owned - 1 - i) * 0.25; // CC sell-back: 25%
  }
  return Math.floor(sum);
}

// prestige level from cumulative forfeited ore: floor(cbrt(forfeited / 1e12))
function prestigeFromForfeit(total) {
  if (total <= 0) return 0;
  return Math.floor(Math.cbrt(total / 1e12));
}

function milkAmount() { return Object.keys(G.feats).length * 0.04; }

function relicFrac() {
  let f = 0;
  RELICS.forEach(r => { if (r.frac && G.relics[r.id]) f = Math.max(f, r.frac); });
  return f;
}

function fingersInfo() {
  if (!G.upgrades["pick-3"]) return { per: 0 };
  let mult = 1;
  PICKAXE_UPGRADES.forEach(u => { if (u.kind === "fingersX" && G.upgrades[u.id]) mult *= u.mult; });
  const nonPick = BUILDINGS.reduce((s, b) => b.id === "pickaxe" ? s : s + G.buildings[b.id].owned, 0);
  return { per: 0.1 * mult, total: 0.1 * mult * nonPick };
}

function buildingTierCount(id) {
  let n = 0;
  if (id === "pickaxe") {
    if (G.upgrades["pick-1"]) n++;
    if (G.upgrades["pick-2"]) n++;
  } else {
    for (let t = 0; t < TIER_AT.length; t++) if (G.upgrades[`${id}-t${t}`]) n++;
  }
  return n;
}

function buildingUnitCps(b) {
  let cps = b.baseCps * Math.pow(2, buildingTierCount(b.id));
  if (b.id === "pickaxe") cps += fingersInfo().total || 0;
  return cps;
}

function globalMult() {
  let m = 1;
  FLAVOR_UPGRADES.forEach(u => { if (G.upgrades[u.id]) m *= 1 + u.pct / 100; });
  // canaries × morale
  const milk = milkAmount() * (G.relics["relic-seraph"] ? 1.1 : 1);
  CANARY_UPGRADES.forEach(u => { if (G.upgrades[u.id]) m *= 1 + milk * u.factor; });
  // prestige: +1% per level, scaled by unlocked relic fraction (CC heavenly chips)
  m *= 1 + G.prestigeLevel * 0.01 * relicFrac();
  return m;
}

function buffMult(type) {
  let m = 1;
  G.buffs.forEach(bf => { if (bf.type === type) m *= bf.mult; });
  return m;
}

function calcCps() {
  let raw = 0;
  BUILDINGS.forEach(b => raw += buildingUnitCps(b) * G.buildings[b.id].owned);
  return raw * globalMult() * buffMult("cps");
}

function calcClickPower() {
  let base = 1 * Math.pow(2, (G.upgrades["pick-1"] ? 1 : 0) + (G.upgrades["pick-2"] ? 1 : 0));
  base += fingersInfo().total || 0;
  let pct = 0;
  CLICK_UPGRADES.forEach(u => { if (G.upgrades[u.id]) pct += 0.01; });
  base += calcCps() * pct;
  return base * buffMult("click");
}

/* ------------------------- FORMATTING ------------------------- */

function fmt(n, dec) {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmt(-n, dec);
  if (n < 1e6) {
    if (dec != null) return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return Math.floor(n).toLocaleString("en-US");
  }
  let tier = Math.floor(Math.log10(n) / 3) - 2; // 0 = million
  if (tier >= FMT_NAMES.length) {
    return n.toExponential(3).replace("e+", "×10^");
  }
  const scaled = n / Math.pow(10, (tier + 2) * 3);
  return scaled.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " " + FMT_NAMES[tier];
}
function fmtCps(n) { return n < 100 ? fmt(n, 1) : fmt(n); }
function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return (h?h+"h ":"") + (m?m+"m ":"") + sec + "s";
}

/* ------------------------- UPGRADE CATALOG ------------------------- */

function buildUpgradeCatalog() {
  const list = [];
  // building tiers
  BUILDINGS.forEach(b => {
    if (b.id === "pickaxe") return;
    const names = TIER_NAMES[b.id];
    for (let t = 0; t < TIER_AT.length; t++) {
      list.push({
        id: `${b.id}-t${t}`,
        name: names[t],
        cost: b.baseCost * TIER_MULT[t],
        building: b.id, tier: t,
        icon: SPRITE(b.id),
        available: g => g.buildings[b.id].owned >= TIER_AT[t],
        desc: `${b.plural} are <b>twice</b> as efficient.`,
        quote: b.quote,
      });
    }
  });
  PICKAXE_UPGRADES.forEach(u => list.push({
    ...u, icon: SPRITE("pickaxe"),
    available: g => g.buildings["pickaxe"].owned >= u.at,
  }));
  CLICK_UPGRADES.forEach(u => list.push({
    ...u, available: g => g.handmade >= u.handmade,
  }));
  CANARY_UPGRADES.forEach(u => list.push({
    ...u, available: g => Object.keys(g.feats).length >= u.feats,
  }));
  FLAVOR_UPGRADES.forEach(u => list.push({
    ...u, available: g => g.totalEarned >= u.earned,
  }));
  NUGGET_UPGRADES.forEach(u => list.push({
    ...u, available: g => g.nuggetsClicked >= u.nuggets,
  }));
  return list;
}
const UPGRADES = buildUpgradeCatalog();
const UPG_INDEX = {}; UPGRADES.forEach(u => UPG_INDEX[u.id] = u);

/* ------------------------- FEATS (achievements) ------------------------- */

function buildFeats() {
  const feats = [];
  const earnedT = [1, 1e3, 1e5, 1e7, 1e9, 1e11, 1e13, 1e15, 1e18, 1e21];
  const earnedN = ["First Glint","Pocket Change","Company Scrip","Payload","Bonanza","Motherlode",
                   "King Midas' Basement","Continental Claim","Planetary Ledger","Post-Scarcity Rock"];
  earnedT.forEach((t, i) => feats.push({
    id:`earn-${i}`, name: earnedN[i], glyph:"🪙",
    desc:`Mine <b>${fmt(t)}</b> ore in one claim.`,
    check: g => g.totalEarned >= t,
  }));
  const cpsT = [1, 10, 100, 1e3, 1e5, 1e7, 1e9];
  const cpsN = ["Steady Drip","Trickle","Stream","Torrent","Avalanche","Tectonic Income","Geologic Flow"];
  cpsT.forEach((t, i) => feats.push({
    id:`cps-${i}`, name: cpsN[i], glyph:"⏳",
    desc:`Reach <b>${fmt(t)}</b> ore per second.`,
    check: g => g.cpsNow >= t,
  }));
  const clickT = [100, 1e3, 1e4, 1e5];
  const clickN = ["Blistered","Callused","Carpal Diem","Arms of Iron"];
  clickT.forEach((t, i) => feats.push({
    id:`click-${i}`, name: clickN[i], glyph:"🖐️",
    desc:`Click the boulder <b>${fmt(t)}</b> times.`,
    check: g => g.clicks >= t,
  }));
  const handT = [1e3, 1e5, 1e7, 1e9];
  const handN = ["Hand-Dug","Honest Labor","By The Sweat","Machines Are For Cowards"];
  handT.forEach((t, i) => feats.push({
    id:`hand-${i}`, name: handN[i], glyph:"💪",
    desc:`Mine <b>${fmt(t)}</b> ore by hand.`,
    check: g => g.handmade >= t,
  }));
  const nugT = [1, 7, 27, 77];
  const nugN = ["Glimmer","Fortune's Friend","Gilded","Chosen of the Vein"];
  nugT.forEach((t, i) => feats.push({
    id:`nug-${i}`, name: nugN[i], glyph:"🌟",
    desc:`Click <b>${fmt(t)}</b> golden nugget${t>1?"s":""}.`,
    check: g => g.nuggetsClicked >= t,
  }));
  BUILDINGS.forEach((b, bi) => {
    [[1,"First"],[50,"Fifty"],[100,"A Hundred"],[150,"An Empire of"]].forEach(([n, word], i) => {
      feats.push({
        id:`b-${b.id}-${i}`, name:`${word} ${n===1?b.name:b.plural}`, icon: SPRITE(b.id),
        desc:`Own <b>${n}</b> ${n===1?b.name:b.plural}.`,
        check: g => g.buildings[b.id].owned >= n,
      });
    });
  });
  feats.push({ id:"all-types", name:"Full Portfolio", glyph:"📜",
    desc:"Own at least one of <b>every</b> holding.",
    check: g => BUILDINGS.every(b => g.buildings[b.id].owned > 0) });
  feats.push({ id:"asc-1", name:"The First Descent", glyph:"🕳️",
    desc:"<b>Descend</b> for the first time.", check: g => g.ascensions >= 1 });
  feats.push({ id:"asc-5", name:"Spelunker Emeritus", glyph:"🦇",
    desc:"<b>Descend</b> five times.", check: g => g.ascensions >= 5 });
  feats.push({ id:"prestige-100", name:"Hundredfold Deep", glyph:"💯",
    desc:"Reach prestige level <b>100</b>.", check: g => g.prestigeLevel >= 100 });
  return feats;
}
const FEATS = buildFeats();

/* ------------------------- DOM HOOKS ------------------------- */

const $ = id => document.getElementById(id);
const el = {
  ore: $("oreCount"), cps: $("cpsCount"),
  boulder: $("boulder"), boulderZone: $("boulderZone"),
  particles: $("clickParticles"), buffBar: $("buffBar"),
  depthName: $("depthName"),
  news: $("newsText"),
  holdingsRows: $("holdingsRows"), holdingsEmpty: $("holdingsEmpty"),
  statsList: $("statsList"),
  featGrid: $("featGrid"), featCount: $("featCount"),
  vaultDiamonds: $("vaultDiamonds"), vaultLevel: $("vaultLevel"),
  vaultBonus: $("vaultBonus"), vaultNext: $("vaultNext"),
  descendBtn: $("descendBtn"), vaultShop: $("vaultShop"),
  upgradeRow: $("upgradeRow"), buildingList: $("buildingList"),
  nuggetLayer: $("nuggetLayer"), toastStack: $("toastStack"),
  tooltip: $("tooltip"),
  game: $("game"),
};

let buyQty = 1; // 1 | 10 | 100 | "sell"

/* ------------------------- SOUND ------------------------- */

let audioCtx = null;
function clink(pitch = 1, gain = 0.08) {
  if (!G.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400 * pitch + Math.random()*300, t);
    osc.frequency.exponentialRampToValueAtTime(300 * pitch, t + 0.07);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.1);
  } catch (e) { /* audio unavailable — mine in silence */ }
}

/* ------------------------- CORE ACTIONS ------------------------- */

function earn(n) {
  G.ore += n;
  G.totalEarned += n;
  G.allTimeEarned += n;
}

function clickBoulder(ev) {
  const power = calcClickPower();
  earn(power);
  G.handmade += power;
  G.clicks++;
  clink(1 + Math.random()*0.2);

  el.boulder.classList.remove("smacked");
  void el.boulder.offsetWidth;
  el.boulder.classList.add("smacked");

  // particles at pointer
  const zone = el.boulderZone.getBoundingClientRect();
  let x = zone.width/2, y = zone.height/2;
  if (ev && ev.clientX) { x = ev.clientX - zone.left; y = ev.clientY - zone.top; }
  spawnFloater(x, y, "+" + fmtCps(power));
  for (let i = 0; i < 5; i++) spawnChip(x, y, Math.random() < 0.4);
  dirty.counters = true;
}

function spawnFloater(x, y, text) {
  const f = document.createElement("div");
  f.className = "floater";
  f.textContent = text;
  f.style.left = (x - 20 + (Math.random()*36 - 18)) + "px";
  f.style.top = (y - 30) + "px";
  el.particles.appendChild(f);
  setTimeout(() => f.remove(), 1150);
}
function spawnChip(x, y, isOre) {
  const c = document.createElement("div");
  c.className = "chip" + (isOre ? " oreChip" : "");
  const ang = Math.random() * Math.PI * 2;
  const dist = 40 + Math.random() * 70;
  c.style.setProperty("--dx", Math.cos(ang) * dist + "px");
  c.style.setProperty("--dy", (Math.sin(ang) * dist * 0.6 + 60) + "px");
  c.style.setProperty("--rot", (Math.random()*520 - 260) + "deg");
  c.style.left = x + "px"; c.style.top = y + "px";
  el.particles.appendChild(c);
  setTimeout(() => c.remove(), 750);
}

function buyBuilding(id) {
  const b = BUILDINGS[B_INDEX[id]];
  const st = G.buildings[id];
  if (buyQty === "sell") {
    if (st.owned <= 0) return;
    const n = 1;
    G.ore += bulkSellValue(b, st.owned, n);
    st.owned -= n;
    clink(0.5, 0.06);
    dirty.store = dirty.holdings = dirty.counters = dirty.upgrades = true;
    return;
  }
  const n = buyQty;
  const cost = bulkPrice(b, st.owned, n);
  if (G.ore < cost) return;
  G.ore -= cost;
  st.owned += n;
  clink(1.6, 0.07);
  dirty.store = dirty.holdings = dirty.counters = dirty.upgrades = true;
}

function buyUpgrade(id) {
  const u = UPG_INDEX[id];
  if (!u || G.upgrades[id] || G.ore < u.cost) return;
  G.ore -= u.cost;
  G.upgrades[id] = true;
  clink(2.2, 0.09);
  toast("Upgrade acquired", u.name);
  dirty.store = dirty.upgrades = dirty.counters = dirty.holdings = true;
}

function buyRelic(id) {
  const r = RELICS.find(r => r.id === id);
  if (!r || G.relics[id]) return;
  if (r.req && !G.relics[r.req]) return;
  const avail = G.diamonds - G.diamondsSpent;
  if (avail < r.cost) return;
  G.diamondsSpent += r.cost;
  G.relics[id] = true;
  clink(3, 0.1);
  toast("Relic claimed", r.name);
  dirty.vault = true;
}

/* ------------------------- GOLDEN NUGGETS ------------------------- */

let nuggetTimer = null;
let activeNugget = null;

function nuggetFreqMult() {
  let m = 1;
  if (G.upgrades["nug-1"]) m *= 2;
  if (G.upgrades["nug-2"]) m *= 2;
  if (G.relics["relic-charm"]) m *= 1.1;
  return m;
}
function nuggetDurMult() {
  let m = 1;
  if (G.upgrades["nug-3"]) m *= 2;
  if (G.relics["relic-idol"]) m *= 1.1;
  return m;
}

function scheduleNugget() {
  clearTimeout(nuggetTimer);
  // base window 150–450s (CC uses 300–900; shortened for mortal attention spans)
  const wait = (150 + Math.random() * 300) / nuggetFreqMult();
  nuggetTimer = setTimeout(spawnNugget, wait * 1000);
}

function spawnNugget() {
  if (activeNugget) { scheduleNugget(); return; }
  const btn = document.createElement("button");
  btn.className = "nugget";
  btn.setAttribute("aria-label", "Golden nugget!");
  const img = document.createElement("img");
  img.src = SPRITE("golden-nugget");
  img.alt = "";
  btn.appendChild(img);
  btn.style.left = (8 + Math.random() * 84) + "vw";
  btn.style.top = (10 + Math.random() * 78) + "vh";
  btn.addEventListener("click", () => popNugget(btn), { once: true });
  el.nuggetLayer.appendChild(btn);
  activeNugget = btn;
  let stay = 13 * (1 + (G.upgrades["nug-1"]?0.05:0) + (G.upgrades["nug-2"]?0.05:0));
  setTimeout(() => {
    if (activeNugget === btn) {
      btn.classList.add("fading");
      setTimeout(() => { btn.remove(); if (activeNugget === btn) activeNugget = null; }, 900);
    }
  }, stay * 1000);
  scheduleNugget();
}

function popNugget(btn) {
  btn.remove();
  if (activeNugget === btn) activeNugget = null;
  G.nuggetsClicked++;
  el.game.classList.remove("quake"); void el.game.offsetWidth; el.game.classList.add("quake");
  clink(2.6, 0.12);

  const roll = Math.random();
  const dur = nuggetDurMult();
  if (roll < 0.46) {
    addBuff({ type:"cps", name:"FRENZY", mult:7, left:77 * dur, total:77 * dur });
    toast("⚡ Frenzy!", "Ore production ×7 for " + Math.round(77*dur) + " seconds!");
  } else if (roll < 0.92) {
    // Lucky: +15% of bank, capped at 15 minutes of production, +13 (CC formula)
    const gain = Math.min(G.ore * 0.15, calcCps() * 900) + 13;
    earn(gain);
    toast("🍀 Lucky strike!", "+" + fmt(gain) + " ore!");
    spawnFloater(el.boulderZone.clientWidth/2, el.boulderZone.clientHeight/2, "+" + fmt(gain));
  } else {
    addBuff({ type:"click", name:"SWING FRENZY", mult:777, left:13 * dur, total:13 * dur });
    toast("💥 Swing Frenzy!", "Clicking power ×777 for " + Math.round(13*dur) + " seconds!");
  }
  dirty.counters = dirty.upgrades = true;
}

function addBuff(bf) {
  const existing = G.buffs.find(b => b.type === bf.type && b.name === bf.name);
  if (existing) { existing.left = bf.left; } else { G.buffs.push(bf); }
  renderBuffs();
  dirty.holdings = true; // per-row /s figures include buff multipliers
}

/* remove any on-screen nugget and restart its clock — old-claim luck must not leak into a new claim */
function clearNugget() {
  if (activeNugget) { activeNugget.remove(); activeNugget = null; }
  scheduleNugget();
}

/* ------------------------- PRESTIGE ------------------------- */

function pendingPrestige() {
  const now = prestigeFromForfeit(G.totalForfeited);
  const after = prestigeFromForfeit(G.totalForfeited + G.totalEarned);
  return after - now;
}

function descend() {
  const gain = pendingPrestige();
  if (gain <= 0) return;
  if (!confirm(`Abandon this claim and DESCEND?\n\nYou will forfeit ${fmt(G.totalEarned)} ore (and all holdings & upgrades) in exchange for ${fmt(gain)} diamond${gain>1?"s":""} and ${fmt(gain)} prestige level${gain>1?"s":""}.\n\nRelics, feats and diamonds are forever.`)) return;

  G.totalForfeited += G.totalEarned;
  G.diamonds += gain;
  G.ascensions++;
  G.prestigeLevel = prestigeFromForfeit(G.totalForfeited);

  const keep = {
    allTimeEarned: G.allTimeEarned, totalForfeited: G.totalForfeited,
    diamonds: G.diamonds, diamondsSpent: G.diamondsSpent,
    ascensions: G.ascensions, nuggetsClicked: G.nuggetsClicked,
    feats: G.feats, relics: G.relics, sound: G.sound,
    started: G.started, prestigeLevel: G.prestigeLevel,
  };
  G = { ...freshGame(), ...keep, ...freshRun() };
  // re-apply persistent bits clobbered by freshRun spread
  if (G.relics["relic-toolbag"]) G.buildings["pickaxe"].owned = 10;
  if (G.relics["relic-foreman"]) G.buildings["prospector"].owned = 5;

  el.game.classList.remove("quake"); void el.game.offsetWidth; el.game.classList.add("quake");
  toast("🕳️ You descend…", `+${fmt(gain)} diamonds. The dark greets you like an old friend.`);
  currentStratum = -1;
  clearNugget();
  renderBuffs();
  allDirty();
  save(true);
}

/* ------------------------- FEATS CHECK ------------------------- */

function checkFeats() {
  let won = 0;
  FEATS.forEach(f => {
    if (!G.feats[f.id] && f.check(G)) {
      G.feats[f.id] = true;
      won++;
      toast("🏅 Feat of Industry", f.name, true);
    }
  });
  if (won) { dirty.feats = dirty.stats = dirty.upgrades = true; }
}

/* ------------------------- RENDERING ------------------------- */

const dirty = { counters:true, store:true, upgrades:true, holdings:true, stats:true, feats:true, vault:true };
function allDirty() { Object.keys(dirty).forEach(k => dirty[k] = true); }

let storeBuilt = false;
const storeEls = {}; // id -> {root, cost, owned}

function buildStore() {
  el.buildingList.innerHTML = "";
  BUILDINGS.forEach(b => {
    const item = document.createElement("button");
    item.className = "b-item";
    item.dataset.id = b.id;
    const img = document.createElement("img");
    img.src = SPRITE(b.id); img.alt = b.name;
    const mid = document.createElement("div");
    const nm = document.createElement("div"); nm.className = "b-name"; nm.textContent = b.name;
    const cost = document.createElement("div"); cost.className = "b-cost";
    mid.appendChild(nm); mid.appendChild(cost);
    const owned = document.createElement("div"); owned.className = "b-owned";
    item.appendChild(img); item.appendChild(mid); item.appendChild(owned);
    item.addEventListener("click", () => buyBuilding(b.id));
    attachTooltip(item, () => buildingTooltip(b));
    el.buildingList.appendChild(item);
    storeEls[b.id] = { root: item, name: nm, cost, owned };
  });
  storeBuilt = true;
}

function highestUnlockedIndex() {
  let hi = 0;
  BUILDINGS.forEach((b, i) => {
    if (G.buildings[b.id].owned > 0 || G.totalEarned >= b.baseCost * 0.5) hi = Math.max(hi, i);
  });
  return hi;
}

function renderStore() {
  if (!storeBuilt) buildStore();
  const hi = highestUnlockedIndex();
  BUILDINGS.forEach((b, i) => {
    const s = storeEls[b.id], st = G.buildings[b.id];
    const tease = i > hi + 1;
    const semi = i === hi + 1 && st.owned === 0;
    s.root.style.display = tease ? "none" : "";
    s.root.classList.toggle("hiddenTease", semi);
    s.name.textContent = semi ? "???" : b.name;
    if (buyQty === "sell") {
      const val = bulkSellValue(b, st.owned, 1);
      s.cost.textContent = st.owned > 0 ? "sell for " + fmt(val) : "none to sell";
      s.cost.classList.toggle("cant", st.owned <= 0);
      s.root.classList.add("selling");
      s.root.classList.toggle("tooPoor", st.owned <= 0);
    } else {
      const cost = bulkPrice(b, st.owned, buyQty);
      s.cost.textContent = fmt(cost) + (buyQty > 1 ? `  (×${buyQty})` : "");
      const cant = G.ore < cost;
      s.cost.classList.toggle("cant", cant);
      s.root.classList.remove("selling");
      s.root.classList.toggle("tooPoor", cant || semi);
    }
    s.owned.textContent = st.owned || "";
  });
}

function visibleUpgrades() {
  return UPGRADES
    .filter(u => !G.upgrades[u.id] && u.available(G))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 12);
}

let upgradeKey = "";
function renderUpgrades() {
  const vis = visibleUpgrades();
  const key = vis.map(u => u.id + (G.ore >= u.cost ? "+" : "-")).join(",");
  if (key === upgradeKey) return;
  upgradeKey = key;
  if (el.upgradeRow.matches(":hover")) el.tooltip.hidden = true; // node under cursor is being replaced
  el.upgradeRow.innerHTML = "";
  vis.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "upg" + (G.ore < u.cost ? " tooPoor" : "");
    if (u.icon) {
      const img = document.createElement("img"); img.src = u.icon; img.alt = u.name;
      btn.appendChild(img);
      if (u.tier != null) {
        const pip = document.createElement("span"); pip.className = "tier-pip";
        pip.textContent = TIER_TAG[u.tier]; btn.appendChild(pip);
      }
    } else {
      const g = document.createElement("span"); g.className = "upg-glyph";
      g.textContent = u.glyph || "⭐"; btn.appendChild(g);
    }
    btn.addEventListener("click", () => buyUpgrade(u.id));
    attachTooltip(btn, () => upgradeTooltip(u));
    el.upgradeRow.appendChild(btn);
  });
}

function renderCounters() {
  el.ore.textContent = fmt(G.ore);
  const cps = G.cpsNow;
  el.cps.textContent = "per second: " + fmtCps(cps);
  document.title = fmt(G.ore) + " ore — DEEPVEIN";
}

const MAX_ROW_SPRITES = 40;
function renderHoldings() {
  const ownedAny = BUILDINGS.some(b => G.buildings[b.id].owned > 0);
  el.holdingsEmpty.style.display = ownedAny ? "none" : "";
  el.holdingsRows.innerHTML = "";
  BUILDINGS.forEach(b => {
    const st = G.buildings[b.id];
    if (st.owned <= 0) return;
    const row = document.createElement("div"); row.className = "holding-row";
    const head = document.createElement("div"); head.className = "holding-head";
    const nm = document.createElement("span"); nm.className = "h-name";
    nm.textContent = `${st.owned} ${st.owned === 1 ? b.name : b.plural}`;
    const cps = document.createElement("span"); cps.className = "h-cps";
    const unit = buildingUnitCps(b) * globalMult() * buffMult("cps");
    cps.textContent = `${fmtCps(unit * st.owned)} /s`;
    head.appendChild(nm); head.appendChild(cps);
    const sprites = document.createElement("div"); sprites.className = "holding-sprites";
    const shown = Math.min(st.owned, MAX_ROW_SPRITES);
    for (let i = 0; i < shown; i++) {
      const img = document.createElement("img");
      img.src = SPRITE(b.id); img.alt = "";
      sprites.appendChild(img);
    }
    if (st.owned > MAX_ROW_SPRITES) {
      const more = document.createElement("span"); more.className = "holding-more";
      more.textContent = `+${fmt(st.owned - MAX_ROW_SPRITES)} more`;
      sprites.appendChild(more);
    }
    row.appendChild(head); row.appendChild(sprites);
    el.holdingsRows.appendChild(row);
  });
}

function statRow(dt, dd) {
  return `<div class="stat-row"><dt>${dt}</dt><dd>${dd}</dd></div>`;
}
function renderStats() {
  const fingers = fingersInfo();
  el.statsList.innerHTML =
    `<div class="stat-section">This Claim</div>` +
    statRow("Ore in the bank", fmt(G.ore)) +
    statRow("Ore mined (this claim)", fmt(G.totalEarned)) +
    statRow("Ore per second", fmtCps(G.cpsNow)) +
    statRow("Ore per swing", fmtCps(calcClickPower())) +
    statRow("Mined by hand", fmt(G.handmade)) +
    statRow("Swings taken", fmt(G.clicks)) +
    statRow("Holdings owned", fmt(BUILDINGS.reduce((s,b)=>s+G.buildings[b.id].owned,0))) +
    `<div class="stat-section">All Time</div>` +
    statRow("Ore mined (all claims)", fmt(G.allTimeEarned)) +
    statRow("Ore forfeited to the deep", fmt(G.totalForfeited)) +
    statRow("Golden nuggets struck", fmt(G.nuggetsClicked)) +
    statRow("Descents", fmt(G.ascensions)) +
    statRow("Feats of industry", `${Object.keys(G.feats).length} / ${FEATS.length}`) +
    statRow("Canary morale", (milkAmount()*100).toFixed(0) + "%") +
    `<div class="stat-section">The Deep</div>` +
    statRow("Prestige level", fmt(G.prestigeLevel)) +
    statRow("Prestige bonus in effect", "+" + (G.prestigeLevel * relicFrac()).toFixed(1) + "% CPS") +
    statRow("Diamonds (unspent)", fmt(G.diamonds - G.diamondsSpent)) +
    (fingers.per ? statRow("Spark bonus per pickaxe", "+" + fmtCps(fingers.total) + " each") : "");
}

let featsBuilt = false;
const featEls = {};
function renderFeats() {
  if (!featsBuilt) {
    el.featGrid.innerHTML = "";
    FEATS.forEach(f => {
      const d = document.createElement("div");
      d.className = "feat";
      if (f.icon) {
        const img = document.createElement("img"); img.src = f.icon; img.alt = f.name;
        img.style.width = "26px"; img.style.height = "26px";
        d.appendChild(img);
      } else d.textContent = f.glyph;
      attachTooltip(d, () => featTooltip(f));
      el.featGrid.appendChild(d);
      featEls[f.id] = d;
    });
    featsBuilt = true;
  }
  FEATS.forEach(f => featEls[f.id].classList.toggle("won", !!G.feats[f.id]));
  el.featCount.textContent = `${Object.keys(G.feats).length} / ${FEATS.length}`;
}

let vaultBuilt = false;
const relicEls = {};
function renderVault() {
  const pending = pendingPrestige();
  el.vaultDiamonds.textContent = fmt(G.diamonds - G.diamondsSpent);
  el.vaultLevel.textContent = fmt(G.prestigeLevel);
  el.vaultBonus.textContent = "+" + (G.prestigeLevel * relicFrac()).toFixed(1) + "%";
  el.descendBtn.disabled = pending <= 0;
  el.descendBtn.textContent = pending > 0 ? `DESCEND  (+${fmt(pending)} 💎)` : "DESCEND";
  if (pending > 0) {
    el.vaultNext.textContent = `Descending now: +${fmt(pending)} diamond${pending>1?"s":""} · +${fmt(pending)} prestige level${pending>1?"s":""}`;
  } else {
    const nextLevel = prestigeFromForfeit(G.totalForfeited) + 1;
    const needTotal = Math.pow(nextLevel, 3) * 1e12;
    const needMore = needTotal - G.totalForfeited - G.totalEarned;
    el.vaultNext.textContent = `Mine ${fmt(Math.max(0,needMore))} more ore this claim to earn a diamond on Descent.`;
  }
  if (!vaultBuilt) {
    el.vaultShop.innerHTML = "";
    RELICS.forEach(r => {
      const d = document.createElement("button");
      d.className = "relic";
      d.textContent = r.glyph;
      d.addEventListener("click", () => { buyRelic(r.id); });
      attachTooltip(d, () => relicTooltip(r));
      el.vaultShop.appendChild(d);
      relicEls[r.id] = d;
    });
    vaultBuilt = true;
  }
  const avail = G.diamonds - G.diamondsSpent;
  RELICS.forEach(r => {
    const d = relicEls[r.id];
    const owned = !!G.relics[r.id];
    const locked = r.req && !G.relics[r.req];
    d.classList.toggle("owned", owned);
    d.classList.toggle("locked", !owned && locked);
    d.classList.toggle("affordable", !owned && !locked && avail >= r.cost);
  });
}

let buffBarKey = null, buffTimeEls = [];
function renderBuffs() {
  const key = G.buffs.map(bf => bf.type + ":" + bf.name + ":" + bf.mult).join("|");
  if (key !== buffBarKey) {
    buffBarKey = key;
    el.buffBar.textContent = "";
    buffTimeEls = [];
    G.buffs.forEach(bf => {
      const d = document.createElement("div");
      d.className = "buff";
      const nm = document.createElement("span"); nm.className = "buff-name";
      nm.textContent = `${bf.name} ×${fmt(bf.mult)}`; // textContent: buff names from saves must never parse as HTML
      const tm = document.createElement("span"); tm.className = "buff-time";
      tm.textContent = fmtTime(bf.left);
      d.appendChild(nm); d.appendChild(tm);
      el.buffBar.appendChild(d);
      buffTimeEls.push(tm);
    });
  } else {
    G.buffs.forEach((bf, i) => { if (buffTimeEls[i]) buffTimeEls[i].textContent = fmtTime(bf.left); });
  }
}

/* strata / boulder evolution */
let currentStratum = -1;
function renderStratum() {
  let idx = 0;
  STRATA.forEach((s, i) => { if (G.totalEarned >= s.at) idx = i; });
  if (idx === currentStratum) return;
  const firstRender = currentStratum === -1;
  currentStratum = idx;
  const s = STRATA[idx];
  const st = el.boulder.style;
  st.setProperty("--rock-hi", s.rock[0]); st.setProperty("--rock-mid", s.rock[1]);
  st.setProperty("--rock-dark", s.rock[2]); st.setProperty("--rock-deep", s.rock[3]);
  st.setProperty("--vein-hi", s.vein[0]); st.setProperty("--vein", s.vein[1]); st.setProperty("--vein-lo", s.vein[2]);
  st.setProperty("--gem-hi", s.gem[0]); st.setProperty("--gem", s.gem[1]); st.setProperty("--gem-lo", s.gem[2]);
  el.depthName.textContent = s.name;
  if (!firstRender) toast("⬇️ New stratum", `You've dug into: ${s.name}`);
  // cracks deepen with depth
  const cracks = document.getElementById("cracks");
  if (cracks) cracks.style.opacity = Math.min(0.6, idx * 0.08);
}

/* ------------------------- TOOLTIPS ------------------------- */

function attachTooltip(elm, html) {
  elm.addEventListener("mouseenter", e => { el.tooltip.innerHTML = html(); el.tooltip.hidden = false; placeTooltip(e); });
  elm.addEventListener("mousemove", placeTooltip);
  elm.addEventListener("mouseleave", () => { el.tooltip.hidden = true; });
}
function placeTooltip(e) {
  const t = el.tooltip;
  const pad = 14;
  let x = e.clientX + pad, y = e.clientY + pad;
  const r = t.getBoundingClientRect();
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
  t.style.left = x + "px"; t.style.top = y + "px";
}

function buildingTooltip(b) {
  const st = G.buildings[b.id];
  if (st.owned === 0 && B_INDEX[b.id] > highestUnlockedIndex()) {
    return `<span class="tt-name">???</span><span class="tt-desc">Keep digging. You'll know it when you can almost afford it.</span>`;
  }
  const unit = buildingUnitCps(b) * globalMult();
  const total = unit * st.owned;
  const share = G.cpsNow > 0 ? (total * buffMult("cps") / G.cpsNow * 100).toFixed(1) : 0;
  let body = `<span class="tt-name">${b.name}</span>`;
  if (buyQty === "sell") {
    body += `<div class="tt-cost">sells for ${fmt(bulkSellValue(b, st.owned, 1))} (25% back)</div>`;
  } else {
    body += `<div class="tt-cost">${fmt(bulkPrice(b, st.owned, buyQty === "sell" ? 1 : buyQty))} ore${buyQty>1?` for ×${buyQty}`:""}</div>`;
  }
  body += `<span class="tt-desc">${b.desc}</span>`;
  if (st.owned > 0) {
    body += `<span class="tt-meta">each produces ${fmtCps(unit)} /s · ${st.owned} owned produce ${fmtCps(total)} /s (${share}% of total)</span>`;
  }
  body += `<span class="tt-quote">“${b.quote}”</span>`;
  return body;
}
function upgradeTooltip(u) {
  return `<span class="tt-name">${u.name}</span>` +
    `<div class="tt-cost">${fmt(u.cost)} ore</div>` +
    `<span class="tt-desc">${u.desc}</span>` +
    (u.quote ? `<span class="tt-quote">“${u.quote}”</span>` : "");
}
function featTooltip(f) {
  const won = G.feats[f.id];
  return `<span class="tt-name">${won ? f.name : "???"}</span>` +
    `<span class="tt-desc">${f.desc}</span>` +
    (won ? `<span class="tt-meta">Achieved. The canaries approve.</span>` : `<span class="tt-quote">Not yet achieved.</span>`);
}
function relicTooltip(r) {
  const owned = G.relics[r.id];
  const locked = r.req && !G.relics[r.req];
  return `<span class="tt-name">${r.name}</span>` +
    `<div class="tt-cost">${fmt(r.cost)} 💎</div>` +
    `<span class="tt-desc">${r.desc}</span>` +
    (locked ? `<span class="tt-meta">Requires: ${RELICS.find(x=>x.id===r.req).name}</span>` : "") +
    (owned ? `<span class="tt-meta">Owned forever.</span>` : "") +
    (r.quote ? `<span class="tt-quote">“${r.quote}”</span>` : "");
}

/* ------------------------- TOASTS & NEWS ------------------------- */

function toast(title, body, isFeat) {
  const t = document.createElement("div");
  t.className = "toast" + (isFeat ? " feat-toast" : "");
  t.innerHTML = `<div class="t-title">${title}</div><div class="t-body">${body}</div>`;
  el.toastStack.appendChild(t);
  while (el.toastStack.children.length > 5) el.toastStack.firstChild.remove();
  setTimeout(() => t.remove(), 5200);
}

function rotateNews() {
  const candidates = NEWS.map(f => typeof f === "function" ? f(G) : f).filter(Boolean);
  el.news.textContent = candidates[Math.floor(Math.random() * candidates.length)];
}

/* ------------------------- SAVE / LOAD ------------------------- */

function serialize() {
  return {
    v: 1,
    ore: G.ore, totalEarned: G.totalEarned, allTimeEarned: G.allTimeEarned,
    handmade: G.handmade, clicks: G.clicks,
    buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, G.buildings[b.id].owned])),
    upgrades: Object.keys(G.upgrades),
    feats: Object.keys(G.feats),
    relics: Object.keys(G.relics),
    buffs: G.buffs,
    totalForfeited: G.totalForfeited, diamonds: G.diamonds, diamondsSpent: G.diamondsSpent,
    ascensions: G.ascensions, nuggetsClicked: G.nuggetsClicked,
    sound: G.sound, started: G.started,
    savedAt: Date.now(),
  };
}

function deserialize(d) {
  const num = v => { v = Number(v); return Number.isFinite(v) && v >= 0 ? v : 0; };
  const g = freshGame();
  g.ore = num(d.ore); g.totalEarned = num(d.totalEarned); g.allTimeEarned = num(d.allTimeEarned);
  g.handmade = num(d.handmade); g.clicks = num(d.clicks);
  if (d.buildings) BUILDINGS.forEach(b => { g.buildings[b.id].owned = Math.floor(num(d.buildings[b.id])); });
  (Array.isArray(d.upgrades) ? d.upgrades : []).forEach(id => { if (UPG_INDEX[id]) g.upgrades[id] = true; });
  (Array.isArray(d.feats) ? d.feats : []).forEach(id => g.feats[id] = true);
  (Array.isArray(d.relics) ? d.relics : []).forEach(id => { if (RELICS.some(r => r.id === id)) g.relics[id] = true; });
  // buffs keep ticking while you're away; rebuild from known fields only
  const away = d.savedAt ? Math.max(0, (Date.now() - num(d.savedAt)) / 1000) : 0;
  g.buffs = (Array.isArray(d.buffs) ? d.buffs : [])
    .filter(b => b && (b.type === "cps" || b.type === "click"))
    .map(b => ({ type: b.type, name: String(b.name || "").slice(0, 24), mult: num(b.mult) || 1,
                 left: num(b.left) - away, total: num(b.total) }))
    .filter(b => b.left > 0);
  g.totalForfeited = num(d.totalForfeited);
  g.diamonds = num(d.diamonds); g.diamondsSpent = Math.min(num(d.diamondsSpent), num(d.diamonds));
  g.ascensions = num(d.ascensions); g.nuggetsClicked = num(d.nuggetsClicked);
  g.sound = d.sound !== false;
  g.started = num(d.started) || Date.now();
  g.prestigeLevel = prestigeFromForfeit(g.totalForfeited);
  return g;
}

function save(silent) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialize()));
    if (!silent) toast("💾 Saved", "Your claim is recorded in the company ledger.");
  } catch (e) { if (!silent) toast("⚠️ Save failed", "The ledger refuses your entry: " + e.message); }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    G = deserialize(JSON.parse(raw));
    return true;
  } catch (e) {
    // don't let the next autosave silently pave over a corrupt-but-recoverable save
    try { localStorage.setItem(SAVE_KEY + "-corrupt", localStorage.getItem(SAVE_KEY)); } catch (_) {}
    return false;
  }
}

function exportSave() {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify(serialize()))));
  prompt("Copy your save code:", data);
}
function importSave() {
  const code = prompt("Paste your save code:");
  if (!code) return;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!parsed || parsed.v !== 1) throw new Error("not a DEEPVEIN save");
    G = deserialize(parsed);
    currentStratum = -1;
    clearNugget();
    $("soundBtn").textContent = "Sound: " + (G.sound ? "ON" : "OFF");
    allDirty(); renderBuffs();
    toast("📥 Imported", "Welcome back to the claim.");
    save(true);
  } catch (e) { toast("⚠️ Import failed", "That code isn't from any ledger we keep."); }
}

function wipe() {
  if (!confirm("Abandon EVERYTHING? Diamonds, relics, feats — the lot. This cannot be undone.")) return;
  if (!confirm("The foreman asks again, gently: really?")) return;
  localStorage.removeItem(SAVE_KEY);
  G = freshGame();
  currentStratum = -1;
  clearNugget();
  $("soundBtn").textContent = "Sound: " + (G.sound ? "ON" : "OFF");
  allDirty(); renderBuffs();
  toast("🕳️ Wiped", "The mountain forgets you. For now.");
}

/* ------------------------- MAIN LOOP ------------------------- */

let lastTick = performance.now();
let uiTimer = 0, newsTimer = 0, saveTimer = 0, featTimer = 0;

function tick(now) {
  const dt = Math.min((now - lastTick) / 1000, 5); // clamp huge tab-sleep gaps
  lastTick = now;

  // buffs decay
  let buffsChanged = false;
  G.buffs = G.buffs.filter(bf => {
    bf.left -= dt;
    if (bf.left <= 0) { buffsChanged = true; toast("…and calm.", `${bf.name} has worn off.`); return false; }
    return true;
  });
  if (buffsChanged) { renderBuffs(); dirty.holdings = true; }

  G.cpsNow = calcCps();
  earn(G.cpsNow * dt);

  uiTimer += dt; newsTimer += dt; saveTimer += dt; featTimer += dt;

  renderCounters(); // cheap, every frame

  if (uiTimer >= 0.25) {
    uiTimer = 0;
    renderBuffs(); // in-place timer text update unless the buff set changed
    renderStratum();
    if (dirty.store || true) renderStore(); // affordability changes constantly
    renderUpgrades();
    if (dirty.holdings) { renderHoldings(); dirty.holdings = false; }
    if (dirty.vault || isTabActive("vault")) { renderVault(); dirty.vault = false; }
    if (isTabActive("stats")) renderStats();
    if (dirty.feats) { renderFeats(); dirty.feats = false; }
  }
  if (featTimer >= 1) { featTimer = 0; checkFeats(); }
  if (newsTimer >= 14) { newsTimer = 0; rotateNews(); }
  if (saveTimer >= 30) { saveTimer = 0; save(true); }

  requestAnimationFrame(tick);
}

function isTabActive(name) {
  const pane = document.getElementById("tab-" + name);
  return pane && pane.classList.contains("active");
}

/* ------------------------- WIRING ------------------------- */

function wire() {
  el.boulder.addEventListener("click", clickBoulder);
  el.boulder.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); clickBoulder(); }
  });

  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".tabpane").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("tab-" + t.dataset.tab).classList.add("active");
      if (t.dataset.tab === "stats") renderStats();
      if (t.dataset.tab === "feats") renderFeats();
      if (t.dataset.tab === "vault") renderVault();
      if (t.dataset.tab === "holdings") renderHoldings();
    });
  });

  document.querySelectorAll(".qty").forEach(q => {
    q.addEventListener("click", () => {
      document.querySelectorAll(".qty").forEach(x => x.classList.remove("active"));
      q.classList.add("active");
      buyQty = q.dataset.qty === "sell" ? "sell" : parseInt(q.dataset.qty, 10);
      renderStore();
    });
  });

  $("descendBtn").addEventListener("click", descend);
  $("saveBtn").addEventListener("click", () => save(false));
  $("exportBtn").addEventListener("click", exportSave);
  $("importBtn").addEventListener("click", importSave);
  $("wipeBtn").addEventListener("click", wipe);
  $("soundBtn").addEventListener("click", () => {
    G.sound = !G.sound;
    $("soundBtn").textContent = "Sound: " + (G.sound ? "ON" : "OFF");
  });

  // beforeunload alone is unreliable on mobile (backgrounded tabs get discarded without it firing)
  window.addEventListener("beforeunload", () => save(true));
  window.addEventListener("pagehide", () => save(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save(true);
  });
}

/* ------------------------- BOOT ------------------------- */

function boot() {
  if (!load()) G = freshGame();
  $("soundBtn").textContent = "Sound: " + (G.sound ? "ON" : "OFF");
  wire();
  buildStore();
  renderFeats();
  renderVault();
  renderHoldings();
  renderBuffs();
  renderStratum();
  rotateNews();
  scheduleNugget();
  allDirty();
  lastTick = performance.now();
  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", boot);

/* Debug/cheat handle (also used by the automated smoke tests). */
window.DEEPVEIN = {
  get state() { return G; },
  earn, calcCps, calcClickPower, buildingPrice, bulkPrice, bulkSellValue,
  prestigeFromForfeit, pendingPrestige, fmt, save, allDirty,
  spawnNugget, // summon a golden nugget for the impatient
};
