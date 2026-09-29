// Dispatch triage (research/design-home-contractor.md, home services 1). A
// dispatcher's screen, not an ad: the customer names the problem, the page
// answers with the phone and a short request. The hero card is a problem
// picker built from the lead's services; each chip is a label for a radio
// inside the request form, so a pick fills the form in and moves focus (and
// the page) to it without any script. A thin rail on the form lights up as it
// fills, and a "while you wait" list gives general safety steps to tick off.
//
// This file also exports the home services glyph set and one line service
// blurbs that the other hs- directions draw with their own treatment.

import {
  callButton,
  faqBlock,
  formHeading,
  ratingProof,
  REQUEST_ID,
  servicesConfirm,
  siteFooter,
  siteHeader,
  themesBlock,
  visitDetails,
} from "../blocks.js";
import { esc, icon } from "../shared.js";

// Home services glyphs: 24 unit grid, drawn as strokes so each direction sets
// its own weight and color. Keys are picked from a service name by HS_MATCH.
export const HS_GLYPHS = {
  cool: "<path d=\"M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9\"/><path d=\"M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5\"/>",
  heat: "<path d=\"M5 20h14\"/><path d=\"M8 16c-1.5-2 1.5-3.5 0-6s1-4 0-6M12 16c-1.5-2 1.5-3.5 0-6s1-4 0-6M16 16c-1.5-2 1.5-3.5 0-6s1-4 0-6\"/>",
  unit: "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"13\" rx=\"1.5\"/><circle cx=\"10\" cy=\"11.5\" r=\"4\"/><path d=\"M10 7.5v8M6 11.5h8M16.5 8.5h1.5M16.5 11h1.5M16.5 13.5h1.5M6 18v2M18 18v2\"/>",
  gauge: "<path d=\"M4.5 16a7.5 7.5 0 1 1 15 0\"/><path d=\"M12 16l4-5\"/><circle cx=\"12\" cy=\"16\" r=\"1.2\"/><path d=\"M4 19.5h16\"/>",
  thermostat: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><path d=\"M12 7.5V9\"/>",
  duct: "<path d=\"M3 8h9a4 4 0 0 1 4 4v8M3 13h7a1 1 0 0 1 1 1v6\"/><path d=\"M18.5 5.5l2-2M18.5 9.5h3M15 4.5V2\"/>",
  leak: "<path d=\"M3 7h8v3H3zM11 8.5h10\"/><path d=\"M7 10v2\"/><path d=\"M7 15.5c1 1.4 1.6 2.4 1.6 3.2a1.6 1.6 0 0 1-3.2 0c0-.8.6-1.8 1.6-3.2z\"/>",
  drain: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5\"/>",
  tank: "<rect x=\"6\" y=\"3.5\" width=\"12\" height=\"15\" rx=\"5\"/><path d=\"M9 21v-2.5M15 21v-2.5M12 3.5V1.5M9.5 12.5h5\"/>",
  faucet: "<path d=\"M4 9h9a4 4 0 0 1 4 4v2\"/><path d=\"M4 6.5v5M8.5 9V6h-2M11 6H6\"/><path d=\"M17 18c.7 1 1.1 1.7 1.1 2.2a1.1 1.1 0 0 1-2.2 0c0-.5.4-1.2 1.1-2.2z\"/>",
  sewer: "<path d=\"M2.5 8h19\"/><path d=\"M4 8l1.5-3M9 8l1.5-3M14 8l1.5-3M19 8l1.5-3\"/><rect x=\"3\" y=\"13\" width=\"18\" height=\"5\" rx=\"2.5\"/><path d=\"M8 13v5M16 13v5\"/>",
  pipes: "<path d=\"M3 6h7v12h11M3 11h3v9\"/><path d=\"M10 6v-2M18 18v-2\"/>",
  panel: "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"1.5\"/><path d=\"M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2M12 3v18\"/>",
  outlet: "<rect x=\"5.5\" y=\"3\" width=\"13\" height=\"18\" rx=\"2\"/><path d=\"M10 7.5v2M14 7.5v2M10 14.5v2M14 14.5v2\"/>",
  bulb: "<path d=\"M12 2.5v3\"/><path d=\"M7 12a5 5 0 1 1 10 0c0 2-1.5 3-2 4.5h-6C8.5 15 7 14 7 12z\"/><path d=\"M9.5 19h5M10.5 21.5h3\"/>",
  fan: "<circle cx=\"12\" cy=\"11\" r=\"1.6\"/><path d=\"M12 3v6.4M10.6 11.8l-6.2 3M13.4 11.8l6.2 3\"/><path d=\"M12 12.6V21M9 21h6\"/>",
  bolt: "<path d=\"M13.5 2.5L6 13.5h5l-1.5 8 7.5-11h-5z\"/>",
  plug: "<path d=\"M9 3v4M15 3v4M6.5 7h11v3a5.5 5.5 0 0 1-11 0z\"/><path d=\"M12 15.5V21\"/>",
  hose: "<rect x=\"3\" y=\"11\" width=\"12\" height=\"8\" rx=\"4\"/><path d=\"M9 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2\"/><path d=\"M19.5 9h3\"/>",
  inspect: "<circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5.5 5.5M8 10.5h5\"/>",
  field: "<path d=\"M2.5 8h19\"/><path d=\"M4 12h16M4 15.5h16M4 19h16\"/><path d=\"M6 12v7M18 12v7\"/><path d=\"M12 4v4\"/>",
  trap: "<rect x=\"4\" y=\"8\" width=\"16\" height=\"11\" rx=\"1.5\"/><path d=\"M4 12h16M10 8V5h4v3M8 15.5h2M14 15.5h2\"/>",
  door: "<path d=\"M3.5 21V7l8.5-4 8.5 4v14\"/><rect x=\"6.5\" y=\"9.5\" width=\"11\" height=\"11.5\"/><path d=\"M6.5 13.3h11M6.5 17.1h11\"/>",
  spring: "<path d=\"M3 12h1.5\"/><path d=\"M4.5 12c0-3 2-3 2 0s2 3 2 0 2-3 2 0 2 3 2 0 2-3 2 0 2 3 2 0\"/><path d=\"M18.5 12H21M3 8v8M21 8v8\"/>",
  opener: "<rect x=\"3\" y=\"5\" width=\"12\" height=\"7\" rx=\"1.5\"/><path d=\"M15 8.5h6M9 12v4M6.5 20h5M9 16v4\"/><circle cx=\"6.5\" cy=\"8.5\" r=\"1\"/>",
  roller: "<circle cx=\"8\" cy=\"12\" r=\"4.5\"/><circle cx=\"8\" cy=\"12\" r=\"1.2\"/><path d=\"M12.5 12H21M17 7v10\"/>",
  water: "<path d=\"M2.5 9c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5M2.5 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5M2.5 19c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5\"/>",
  smoke: "<path d=\"M8 21c-2-2.5 2-4.5 0-7s2-4.5 0-7\"/><path d=\"M14 21c-2-2.5 2-4.5 0-7s2-4.5 0-7\"/><path d=\"M19 16c-1.2-1.5 1.2-2.7 0-4.2\"/>",
  air: "<path d=\"M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5M3 16.5h8\"/>",
  cloud: "<path d=\"M7 16.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 16.5z\"/><path d=\"M9 19.5l-1 2M13 19.5l-1 2M17 19.5l-1 2\"/>",
  hammer: "<path d=\"M13.5 4.5l6 6-2.5 2.5-6-6z\"/><path d=\"M12.2 8.8L4 17a1.9 1.9 0 0 0 2.7 2.7l8.2-8.2\"/>",
  fridge: "<rect x=\"6\" y=\"2.5\" width=\"12\" height=\"19\" rx=\"1.5\"/><path d=\"M6 9.5h12M9 5.5v2M9 12.5v3\"/>",
  washer: "<rect x=\"4.5\" y=\"2.5\" width=\"15\" height=\"19\" rx=\"1.5\"/><circle cx=\"12\" cy=\"13.5\" r=\"4.5\"/><path d=\"M4.5 7h15M7.5 4.8h2\"/><path d=\"M9.5 14.5c1.5-1 3.5 1 5 0\"/>",
  oven: "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1.5\"/><path d=\"M4 8h16\"/><rect x=\"7\" y=\"11\" width=\"10\" height=\"7\" rx=\"1\"/><circle cx=\"8\" cy=\"5.5\" r=\".8\"/><circle cx=\"12\" cy=\"5.5\" r=\".8\"/><circle cx=\"16\" cy=\"5.5\" r=\".8\"/>",
  dishwasher: "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1.5\"/><path d=\"M4 7h16M7 5h3M8 11.5l1.5 5h5l1.5-5z\"/>",
  ice: "<path d=\"M12 3l7.5 4.3v8.7L12 20.3 4.5 16V7.3z\"/><path d=\"M12 11.6l7.5-4.3M12 11.6L4.5 7.3M12 11.6v8.7\"/>",
  home: "<path d=\"M3.5 11L12 4l8.5 7\"/><path d=\"M5.5 9.5V20h13V9.5\"/><path d=\"M10 20v-5.5h4V20\"/>",
  termite: "<path d=\"M3 18.5c3-2 5-2 9 0s6 2 9 0M3 14c3-2 5-2 9 0s6 2 9 0\"/><path d=\"M3 5.5h18v4.5H3z\"/>",
  rodent: "<path d=\"M3.5 15.5a6.5 5 0 0 1 13 0z\"/><circle cx=\"14\" cy=\"10.5\" r=\"2\"/><path d=\"M16.5 15.5c2 0 3.5 1 4 3\"/><circle cx=\"12.5\" cy=\"12.5\" r=\".6\"/>",
  mosquito: "<path d=\"M12 8v9\"/><path d=\"M12 10c-2-4-6-5-8.5-4 1 2.5 4.5 4.5 8.5 4zM12 10c2-4 6-5 8.5-4-1 2.5-4.5 4.5-8.5 4z\"/><path d=\"M12 8l-1.5-4.5M12 17l-3 3.5M12 17l3 3.5M12 14l-4 1.5M12 14l4 1.5\"/>",
  bed: "<path d=\"M3 18.5V6M3 14h18v4.5M21 14v-2.5a2.5 2.5 0 0 0-2.5-2.5H11v5\"/><circle cx=\"7\" cy=\"11\" r=\"2\"/>",
  leaf: "<path d=\"M5 19C5 10 11 4.5 20 4.5c0 9-5.5 14.5-15 14.5z\"/><path d=\"M5 19l8-8\"/>",
  check: "<rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"2\"/><path d=\"M8 12.5l2.8 2.8L16.5 9\"/>",
  calendar: "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14\" rx=\"1.5\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/>",
  wrench: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M8.5 12.5l2.3 2.3 4.7-5.3\"/>",
};

// Service name to glyph and a one line description of what the service
// usually covers. The lines describe the kind of work, never this business.
const HS_MATCH = [
  [/\b(ac|a\/c|air condition|cooling)\b/i, "cool", ["When the house will not cool down or the unit runs and runs.", "Cuando la casa no enfría o el equipo no deja de trabajar."]],
  [/heat(ing)?\b(?!.*water)|furnace|heat pump/i, "heat", ["No heat, uneven rooms or a furnace that keeps shutting off.", "Sin calefacción, cuartos disparejos o un calentón que se apaga."]],
  [/replace|new system|install(ation)? of (a )?system/i, "unit", ["Talk through options when an older system is near its end.", "Platique opciones cuando un equipo viejo ya está por terminar."]],
  [/tune|maintenance|check.?up/i, "gauge", ["A seasonal look before the hot or cold months start.", "Una revisión de temporada antes de los meses de calor o frío."]],
  [/thermostat/i, "thermostat", ["Swapping or setting up a thermostat that fits the system.", "Cambiar o instalar un termostato que vaya con el equipo."]],
  [/duct/i, "duct", ["Dusty vents, weak airflow or rooms that never feel right.", "Rejillas con polvo, poco aire o cuartos que nunca se sienten bien."]],
  [/leak/i, "leak", ["Drips under sinks, wet spots on walls or ceilings.", "Goteras bajo el lavabo, manchas húmedas en paredes o techos."]],
  [/grease/i, "trap", ["Grease trap pumping for kitchens that need it on a schedule.", "Vaciado de trampas de grasa para cocinas que lo necesitan seguido."]],
  [/drain field|leach/i, "field", ["Soggy ground, odors or slow drains that point to the drain field.", "Suelo encharcado, olores o drenajes lentos que apuntan al campo de drenaje."]],
  [/drain|clog/i, "drain", ["Slow or backed up sinks, tubs, showers and floor drains.", "Lavabos, tinas, regaderas y coladeras lentas o tapadas."]],
  [/water heater|hot water|tankless/i, "tank", ["No hot water, a leaking tank or water that never gets hot enough.", "Sin agua caliente, un boiler que gotea o agua que no calienta."]],
  [/toilet|faucet|fixture/i, "faucet", ["Running toilets, dripping faucets and loose fixtures.", "Tazas que no dejan de correr, llaves que gotean y muebles flojos."]],
  [/sewer/i, "sewer", ["Backups in more than one drain, or a smell from the yard line.", "Tapones en más de un drenaje o mal olor en la línea del patio."]],
  [/repip|pipe/i, "pipes", ["Old or failing supply lines, planned room by room.", "Tuberías viejas o dañadas, planeadas cuarto por cuarto."]],
  [/panel|breaker/i, "panel", ["Breakers that trip, an old panel, or room for new circuits.", "Pastillas que se botan, un centro de carga viejo o espacio para circuitos."]],
  [/outlet|switch/i, "outlet", ["Dead outlets, warm switch plates and loose receptacles.", "Contactos sin corriente, apagadores tibios y contactos flojos."]],
  [/light/i, "bulb", ["New fixtures, recessed lights and lighting that finally works.", "Lámparas nuevas, luces empotradas e iluminación que por fin funciona."]],
  [/fan/i, "fan", ["Hanging or replacing a ceiling fan on the right box.", "Colgar o cambiar un ventilador de techo en la caja correcta."]],
  [/\bev\b|charger/i, "plug", ["A charger for the garage, sized to the panel you have.", "Un cargador para la cochera, según el centro de carga que tiene."]],
  [/troubleshoot|diagnos|electrical/i, "bolt", ["Flickering, buzzing or power that is out in part of the house.", "Luces que parpadean, zumbidos o parte de la casa sin luz."]],
  [/pump/i, "hose", ["Pumping out the tank, and a look at how it is doing.", "Vaciar la fosa y revisar cómo está."]],
  [/inspect/i, "inspect", ["A look at the system for a sale, a purchase or peace of mind.", "Una revisión del sistema para una venta, una compra o tranquilidad."]],
  [/tank install|new tank|tank/i, "tank", ["Planning a new tank, from the site to the hookup.", "Planear una fosa nueva, desde el terreno hasta la conexión."]],
  [/spring/i, "spring", ["A door that will not lift, often a broken or worn spring.", "Una puerta que no sube, muchas veces un resorte roto o gastado."]],
  [/opener|remote|keypad/i, "opener", ["Openers that hum, reverse or ignore the remote.", "Motores que zumban, se regresan o no hacen caso al control."]],
  [/cable|roller|track/i, "roller", ["Crooked doors, frayed cables and noisy rollers.", "Puertas chuecas, cables deshilachados y rodillos ruidosos."]],
  [/new (garage )?door|garage door/i, "door", ["Doors that stick, sag, grind or will not close all the way.", "Puertas que se atoran, se caen, rechinan o no cierran completas."]],
  [/water damage|flood/i, "water", ["Standing water, soaked floors and wet drywall after a leak.", "Agua estancada, pisos mojados y tablaroca húmeda después de una fuga."]],
  [/fire|smoke/i, "smoke", ["Soot, smoke odor and cleanup after a fire.", "Hollín, olor a humo y limpieza después de un incendio."]],
  [/mold/i, "leaf", ["Musty rooms and spots that keep coming back.", "Cuartos con olor a humedad y manchas que regresan."]],
  [/storm/i, "cloud", ["Cleanup after wind, hail or water gets inside.", "Limpieza después de viento, granizo o agua que entra."]],
  [/dry|dehumid/i, "air", ["Air movers and dehumidifiers until the space is dry.", "Ventiladores y deshumidificadores hasta que el espacio quede seco."]],
  [/repair.*after|rebuild/i, "hammer", ["Putting rooms back together once everything is dry and clean.", "Dejar los cuartos como estaban cuando todo está seco y limpio."]],
  [/refrigerator|fridge|freezer/i, "fridge", ["A fridge that is warm, loud or leaving water on the floor.", "Un refri que no enfría, hace ruido o deja agua en el piso."]],
  [/washer|dryer|laundry/i, "washer", ["Washers that will not drain or spin, dryers that will not heat.", "Lavadoras que no desaguan ni exprimen, secadoras que no calientan."]],
  [/oven|range|stove|cooktop/i, "oven", ["Burners that will not light and ovens that will not hold heat.", "Quemadores que no prenden y hornos que no mantienen el calor."]],
  [/dishwasher/i, "dishwasher", ["Dishes that come out dirty, or water left in the bottom.", "Trastes que salen sucios o agua que se queda abajo."]],
  [/ice/i, "ice", ["An ice maker that stopped, leaks or makes tiny cubes.", "Una fábrica de hielo que no trabaja, gotea o hace cubos chicos."]],
  [/termite/i, "termite", ["Mud tubes, soft wood or winged swarms near the house.", "Túneles de lodo, madera blanda o enjambres con alas cerca de la casa."]],
  [/rodent|mice|rat/i, "rodent", ["Droppings, gnawing or noises in the attic or walls.", "Excremento, mordidas o ruidos en el ático o las paredes."]],
  [/mosquito/i, "mosquito", ["A yard you would like to use in the evening again.", "Un patio que quiere volver a usar en las tardes."]],
  [/bed ?bug/i, "bed", ["Bites after sleeping or small spots on the sheets.", "Piquetes al despertar o manchitas en las sábanas."]],
  [/wildlife|raccoon|squirrel|bird/i, "leaf", ["Animals in the attic, crawl space or chimney.", "Animales en el ático, el sótano o la chimenea."]],
  [/pest/i, "home", ["Ants, roaches, spiders and other pests inside the house.", "Hormigas, cucarachas, arañas y otras plagas dentro de la casa."]],
  [/maint|visit/i, "calendar", ["A regular visit so small problems stay small.", "Una visita regular para que los problemas chicos sigan chicos."]],
  [/repair/i, "wrench", ["Describe what it is doing and ask what the fix involves.", "Describa qué hace y pregunte qué implica arreglarlo."]],
];

const HS_FALLBACK = ["wrench", ["Describe what you are seeing and ask what it involves.", "Describa lo que ve y pregunte qué implica."]];

function hsMatch(name) {
  const hit = HS_MATCH.find(([re]) => re.test(String(name || "")));
  return hit ? [hit[1], hit[2]] : HS_FALLBACK;
}

export function hsGlyphKey(name) {
  return hsMatch(name)[0];
}

// A glyph as inline svg. `stroke` is the line weight in grid units.
export function hsGlyph(name, { cls = "hs-glyph", stroke = 2, key = "" } = {}) {
  const k = key || hsGlyphKey(name);
  return `<svg class="${esc(cls)}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${HS_GLYPHS[k] || HS_GLYPHS.wrench}</svg>`;
}

// [en, es] one line about what a service usually covers.
export function hsBlurb(name) {
  return hsMatch(name)[1];
}

// General "while you wait" safety steps per category. Worded as general
// guidance a visitor could find anywhere, never as this business's instructions.
export const WHILE_YOU_WAIT = {
  plumbing: [
    ["Shut the water off at the fixture valve, or at the main if you cannot find it.", "Cierre el agua en la llave del mueble, o en la llave general si no la encuentra."],
    ["Move rugs, boxes and anything valuable away from the water.", "Retire tapetes, cajas y cosas de valor lejos del agua."],
    ["Stop using drains that are backing up, including the dishwasher.", "Deje de usar los drenajes que se regresan, incluida la lavavajillas."],
    ["Take a few photos of the problem for your own records.", "Tome unas fotos del problema para sus registros."],
  ],
  hvac: [
    ["Check that the thermostat is set to heat or cool and has fresh batteries.", "Revise que el termostato esté en calor o frío y tenga pilas nuevas."],
    ["Look at the breaker for the system and the switch near the indoor unit.", "Revise la pastilla del equipo y el interruptor junto a la unidad interior."],
    ["Swap a dirty filter if you can reach it easily.", "Cambie el filtro sucio si lo alcanza con facilidad."],
    ["Keep the outdoor unit clear of leaves, toys and covers.", "Mantenga la unidad exterior libre de hojas, juguetes y cubiertas."],
  ],
  electrical: [
    ["If you see sparks, smoke or smell burning, get everyone out and call 911.", "Si ve chispas, humo o huele a quemado, salgan todos y llame al 911."],
    ["Unplug anything on the circuit that is acting up.", "Desconecte lo que esté fallando en ese circuito."],
    ["Reset a tripped breaker once. If it trips again, leave it off.", "Suba una pastilla botada una vez. Si se vuelve a botar, déjela abajo."],
    ["Note which rooms and outlets are affected.", "Anote qué cuartos y contactos están afectados."],
  ],
  septic: [
    ["Cut back on water: hold off on laundry, long showers and the dishwasher.", "Use menos agua: espere con la ropa, las regaderas largas y la lavavajillas."],
    ["Keep people and pets away from wet or soggy ground over the system.", "Mantenga a personas y mascotas lejos del suelo mojado sobre el sistema."],
    ["Do not open the tank lid or climb into anything yourself.", "No abra la tapa de la fosa ni se meta usted."],
    ["Note when the backup or smell started and which drains are slow.", "Anote cuándo empezó el tapón u olor y qué drenajes están lentos."],
  ],
  "garage-door": [
    ["Keep people, pets and cars out of the door's path.", "Mantenga a personas, mascotas y carros fuera del paso de la puerta."],
    ["Do not force the door or try to adjust springs or cables yourself.", "No fuerce la puerta ni intente ajustar resortes o cables usted."],
    ["Unplug the opener if it keeps running or reversing.", "Desconecte el motor si no deja de trabajar o se regresa."],
    ["Take a photo of the springs and track from a safe distance.", "Tome una foto de los resortes y el riel desde una distancia segura."],
  ],
  "appliance-repair": [
    ["Unplug the appliance or switch off its breaker.", "Desconecte el aparato o baje su pastilla."],
    ["For a gas appliance and a gas smell, leave the house and call the gas company or 911.", "Si es de gas y huele a gas, salga de la casa y llame a la compañía de gas o al 911."],
    ["Turn off the water supply to a leaking washer, fridge or dishwasher.", "Cierre el agua de la lavadora, el refri o la lavavajillas que gotea."],
    ["Write down the model number from the label inside the door.", "Anote el número de modelo de la etiqueta dentro de la puerta."],
  ],
  restoration: [
    ["Stay out of rooms with standing water if the power is still on there.", "No entre a cuartos con agua estancada si ahí sigue habiendo corriente."],
    ["Stop the source if you can do it safely, such as the main water valve.", "Detenga la fuente si puede hacerlo sin riesgo, como la llave general del agua."],
    ["Take photos of every room before you move or throw anything out.", "Tome fotos de cada cuarto antes de mover o tirar algo."],
    ["Move photos, papers and electronics to a dry room.", "Lleve fotos, papeles y aparatos a un cuarto seco."],
  ],
  "pest-control": [
    ["Keep kids and pets out of the area where you see activity.", "Mantenga a niños y mascotas fuera del área donde ve actividad."],
    ["Hold off on sprays or mixing products before someone takes a look.", "Espere con los aerosoles o mezclar productos antes de que alguien revise."],
    ["Note where and when you see them, and take a photo if you can.", "Anote dónde y cuándo los ve, y tome una foto si puede."],
    ["Store food in sealed containers and take the trash out.", "Guarde la comida en recipientes cerrados y saque la basura."],
  ],
};

export function whileYouWait(ctx) {
  return WHILE_YOU_WAIT[ctx.categoryKey] || WHILE_YOU_WAIT.plumbing;
}

// Adds an id to the request form and puts markup at its start, so a
// direction can link its own controls to the shared form.
export function formWith(ctx, { id, prepend = "" }) {
  return ctx.form.replace(/<form\b([^>]*)>/, (m, attrs) => `<form id="${esc(id)}"${attrs}>\n${prepend}`);
}

// Up to six problem chips from the services list, as [label, glyph key].
export function problemChips(ctx, count = 6) {
  return ctx.services.slice(0, count);
}

const PALETTES = [
  { key: "triage-paper", name: "Paper and signal", vars: { bg: "#f6f5f1", surface: "#ffffff", ink: "#111418", muted: "#5b616b", line: "#dcdad3", primary: "#c63d0a", "on-primary": "#ffffff", accent: "#1f6f5c", band: "#111418", "on-band": "#f6f5f1", "band-muted": "#aeb3ba", "pri-text": "#b3370a", card: "#ffffff", "card-ink": "#111418", chip: "#f6f5f1" } },
  { key: "triage-night", name: "Night line", vars: { bg: "#0e1216", surface: "#161c22", ink: "#eef1f4", muted: "#9aa4af", line: "#26303a", primary: "#ffb020", "on-primary": "#111418", accent: "#4cc3a5", band: "#ffb020", "on-band": "#111418", "band-muted": "#4a3a12", "pri-text": "#ffb020", card: "#161c22", "card-ink": "#eef1f4", chip: "#0e1216" } },
  { key: "triage-blue", name: "Clean blue", vars: { bg: "#ffffff", surface: "#f1f4f9", ink: "#0d1b2e", muted: "#51607a", line: "#d9e0ea", primary: "#1847d6", "on-primary": "#ffffff", accent: "#b88a00", band: "#0d1b2e", "on-band": "#ffffff", "band-muted": "#a9b6ca", "pri-text": "#1847d6", card: "#ffffff", "card-ink": "#0d1b2e", chip: "#f1f4f9" } },
];

// The four stages of a typical visit. General practice, no promises.
const VISIT = [
  { title: ["Describe it", "Descríbalo"], body: ["Call or send the form: what you see, where in the house, since when.", "Llame o mande el formulario: qué ve, en qué parte de la casa, desde cuándo."] },
  { title: ["Talk it through", "Platíquelo"], body: ["Ask what it sounds like and what a visit would involve.", "Pregunte qué podría ser y qué implicaría una visita."] },
  { title: ["Pick a time", "Elija un horario"], body: ["Settle on a window that works for the household.", "Acuerden un horario que le funcione a la casa."] },
  { title: ["The visit", "La visita"], body: ["Someone looks at it in person and walks you through the options before work starts.", "Alguien lo revisa en persona y le explica las opciones antes de empezar."] },
];

const CSS = `
:root{--display:"Geist",system-ui,sans-serif;--body:"Geist",system-ui,sans-serif;--mono:"Geist Mono",ui-monospace,monospace;--radius:6px;--btn-radius:6px;--chip-radius:6px;--max:1200px;--ease:cubic-bezier(.22,1,.36,1);--field:var(--surface);--field-line:var(--line);--star:var(--accent);--lang-fg:var(--ink);--lang-on:var(--bg);--callbar-radius:8px}
body{font-size:1.0625rem;line-height:1.6;letter-spacing:-.005em}
.dt-mono{font-family:var(--mono);font-size:.75rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase}
.dt-dot{display:inline-block;width:.5rem;height:.5rem;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 22%,transparent)}

.b-hd{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--bg) 92%,transparent);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.b-hd__in{display:flex;align-items:center;gap:1.25rem;min-height:4rem}
.b-brand{margin-right:auto;font-weight:800;font-size:1.15rem;letter-spacing:-.02em;line-height:1.1;text-decoration:none;max-width:52vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-nav{display:none;gap:1.5rem;font-size:.95rem;font-weight:500;color:var(--muted)}
.b-nav a{text-decoration:none}
.b-nav a:hover{color:var(--ink)}
@media (min-width:1040px){.b-nav{display:flex}}
.b-hd__end{display:flex;align-items:center;gap:.75rem}
.b-hd__tel{display:none;align-items:center;gap:.5rem;padding:.55rem .8rem;border:1px solid var(--line);border-radius:6px;font-family:var(--mono);font-weight:500;font-size:.95rem;text-decoration:none;background:var(--surface)}
.b-hd__tel .ico{color:var(--pri-text)}
@media (min-width:700px){.b-hd__tel{display:inline-flex}}
.b-hd__cta{display:inline-flex;align-items:center;min-height:2.6rem;padding:0 1rem;border-radius:6px;background:var(--primary);color:var(--on-primary);font-weight:600;font-size:.95rem;text-decoration:none}

.dt-hero{padding:clamp(2.5rem,6vw,5rem) 0 clamp(3rem,6vw,5rem);border-bottom:1px solid var(--line)}
.dt-hero__grid{display:grid;gap:clamp(2rem,5vw,4rem);align-items:center}
@media (min-width:980px){.dt-hero--split .dt-hero__grid{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}}
.dt-hero--stack .dt-hero__copy{display:grid;gap:0 4rem}
@media (min-width:980px){.dt-hero--stack .dt-hero__copy{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:end}.dt-hero--stack .dt-label{grid-column:1/-1}.dt-hero--stack .dt-side{padding-bottom:.4rem}}
.dt-label{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;color:var(--muted)}
.dt-label b{color:var(--ink);font-weight:500}
.dt-h1{margin-top:1.1rem;font-weight:800;font-size:clamp(2.4rem,5vw,4.2rem);line-height:1.02;letter-spacing:-.035em;max-width:16ch}
.dt-sub{margin-top:1.1rem;max-width:44ch;color:var(--muted);font-size:1.12rem}
.dt-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;margin-top:1.75rem}
.dt-call{display:inline-flex;align-items:center;gap:.7rem;min-height:3.5rem;padding:0 1.4rem;border-radius:6px;background:var(--primary);color:var(--on-primary);font-weight:700;font-size:1.1rem;text-decoration:none;transition:transform .3s var(--ease),filter .2s}
.dt-call span{font-variant-numeric:tabular-nums}
.dt-call:hover{transform:translateY(-2px);filter:brightness(1.06)}
.dt-link{display:inline-flex;align-items:center;gap:.45rem;font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.3em}
.dt-link .ico{transition:transform .3s var(--ease)}
.dt-link:hover .ico{transform:translateX(3px)}
.dt-hero .b-rating{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-top:1.5rem;color:var(--muted);font-size:.95rem}
.dt-hero .b-rating__num{font-weight:800;color:var(--ink);font-size:1.05rem}
.dt-hero .stars{width:5.5rem;height:1.1rem}

.dt-card{position:relative;background:var(--card);color:var(--card-ink);border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 0 var(--line),0 24px 60px -32px rgb(10 14 20 / .35);overflow:hidden}
.dt-card__top{display:flex;justify-content:space-between;gap:1rem;padding:.8rem 1.25rem;border-bottom:1px solid var(--line);color:var(--muted)}
.dt-card__body{padding:1.25rem 1.25rem 1.4rem}
.dt-card h2{font-weight:700;font-size:1.45rem;letter-spacing:-.02em;line-height:1.15}
.dt-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin-top:1.1rem}
.dt-hero--stack .dt-chips{grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))}
.dt-chip{display:flex;align-items:center;gap:.7rem;min-height:3.6rem;padding:.7rem .85rem;border:1px solid var(--line);border-radius:6px;background:var(--chip);font-weight:500;font-size:.98rem;line-height:1.25;cursor:pointer;transition:border-color .2s,background-color .2s,transform .2s var(--ease)}
.dt-chip:hover{border-color:var(--ink)}
.dt-chip:active{transform:scale(.98)}
.dt-chip .hs-glyph{flex:none;width:1.4rem;height:1.4rem;color:var(--pri-text)}
.dt-confirm{display:flex;gap:.6rem;align-items:flex-start;margin-top:1.1rem;padding:.8rem .9rem;border-radius:6px;background:color-mix(in oklab,var(--accent) 10%,transparent);font-size:.92rem;min-height:3rem}
.dt-confirm .ico{flex:none;color:var(--accent);margin-top:.15rem}
.dt-confirm [data-pick]{display:none}
.dt-card__foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.75rem;margin-top:1rem}
.dt-card__foot .dt-mono{color:var(--muted)}
${[0, 1, 2, 3, 4, 5].map((i) => `body:has(#dt-pb-${i}:checked) label.dt-chip[for="dt-pb-${i}"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}body:has(#dt-pb-${i}:checked) label.dt-chip[for="dt-pb-${i}"] .hs-glyph{color:inherit}body:has(#dt-pb-${i}:checked) .dt-confirm [data-pick="${i}"]{display:inline}`).join("\n")}
body:has([name="problem"]:checked) .dt-confirm [data-pick="none"]{display:none}
.dt-confirm [data-pick="none"]{display:inline}

.dt-band{background:var(--band);color:var(--on-band)}
.dt-band__in{display:grid;gap:1.25rem 3rem;padding:1.6rem 0;align-items:center}
@media (min-width:860px){.dt-band__in{grid-template-columns:auto minmax(0,1fr) auto}}
.dt-band .b-rating{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.25rem}
.dt-band .b-rating__num,.dt-band .b-rating__big{font-weight:800;font-size:2.6rem;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.dt-band .b-rating__count,.dt-band .b-rating__lbl{font-family:var(--mono);font-size:.8rem;letter-spacing:.05em;text-transform:uppercase}
.dt-band .b-rating--numbers{gap:1.5rem 2.5rem}
.dt-band .b-rating__cell{display:grid;gap:.25rem}
.dt-band .stars{color:var(--on-band);width:6.5rem;height:1.3rem}
.dt-band__note{color:var(--band-muted);font-size:.95rem;max-width:44ch}
.dt-band__tel{display:inline-flex;align-items:center;gap:.6rem;font-family:var(--mono);font-size:1.15rem;font-weight:500;text-decoration:none;padding:.7rem 1rem;border:1px solid color-mix(in oklab,var(--on-band) 35%,transparent);border-radius:6px}

.dt-sec{padding:clamp(3.5rem,8vw,6.5rem) 0}
.dt-sec--alt{background:var(--surface)}
.dt-head{display:grid;gap:.9rem;max-width:44rem}
.dt-h2{font-weight:800;font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1.05;letter-spacing:-.03em}
.dt-lede{color:var(--muted);max-width:56ch}
.dt-req__side .dt-lede,.dt-area .dt-lede{margin-top:.9rem}

.dt-visit{display:grid;gap:0;margin-top:2.75rem;border-top:1px solid var(--line)}
@media (min-width:860px){.dt-visit{grid-template-columns:repeat(4,minmax(0,1fr))}}
.dt-visit li{position:relative;padding:1.5rem 1.5rem 1.5rem 0;border-bottom:1px solid var(--line)}
@media (min-width:860px){.dt-visit li{border-bottom:0;padding:1.75rem 1.75rem 0 0}.dt-visit li+li{padding-left:1.75rem;border-left:1px solid var(--line)}}
.dt-visit .dt-mono{color:var(--pri-text)}
.dt-visit h3{margin-top:.7rem;font-weight:700;font-size:1.25rem;letter-spacing:-.015em}
.dt-visit p{margin-top:.4rem;color:var(--muted);font-size:.98rem}
.dt-visit li::before{content:"";position:absolute;top:-1px;left:0;width:2.5rem;height:2px;background:var(--primary)}
@media (min-width:860px){.dt-visit li+li::before{left:1.75rem}}

.dt-svc{display:grid;margin-top:2.5rem;border-top:1px solid var(--line)}
@media (min-width:860px){.dt-svc{grid-template-columns:1fr 1fr;column-gap:3rem}}
.dt-svc li{display:grid;grid-template-columns:2.75rem minmax(0,1fr) auto;gap:.35rem 1rem;align-items:start;padding:1.25rem 0;border-bottom:1px solid var(--line)}
.dt-svc .hs-glyph{width:1.6rem;height:1.6rem;color:var(--pri-text);margin-top:.15rem}
.dt-svc h3{font-weight:600;font-size:1.12rem;letter-spacing:-.01em}
.dt-svc p{grid-column:2;color:var(--muted);font-size:.95rem}
.dt-svc a{grid-row:1;grid-column:3;font-family:var(--mono);font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-underline-offset:.3em;white-space:nowrap}
.dt-svc a:hover{color:var(--ink)}
.b-svc-confirm{margin-top:1.25rem;font-family:var(--mono);font-size:.8rem;letter-spacing:.03em;color:var(--muted)}
.svc-note{margin-top:.35rem;color:var(--muted);font-size:.9rem}

.dt-why{display:grid;gap:2rem}
@media (min-width:900px){.dt-why{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.dt-why .b-themes{display:grid;gap:0;border-top:1px solid var(--line)}
.dt-why .b-themes li{display:flex;gap:1rem;align-items:baseline;padding:1rem 0;border-bottom:1px solid var(--line);font-size:1.2rem;font-weight:600;letter-spacing:-.01em}
.dt-why .b-themes li::before{content:"";flex:none;width:.55rem;height:.55rem;border-radius:2px;background:var(--accent);transform:translateY(-.1rem)}
.b-themes__note{margin-top:.9rem;font-family:var(--mono);font-size:.75rem;letter-spacing:.03em;color:var(--muted)}

.dt-wait{display:grid;gap:2rem;align-items:start}
@media (min-width:900px){.dt-wait{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem}}
.dt-check{display:grid;gap:.6rem}
.dt-check label{position:relative;display:grid;grid-template-columns:1.6rem minmax(0,1fr);gap:.9rem;align-items:start;padding:1rem 1.1rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);cursor:pointer;transition:border-color .2s,background-color .2s}
.dt-check label:hover{border-color:var(--muted)}
.dt-check input{position:absolute;opacity:0;width:1px;height:1px}
.dt-box{display:grid;place-items:center;width:1.6rem;height:1.6rem;border:1.5px solid var(--muted);border-radius:4px;color:transparent;transition:background-color .2s,border-color .2s,color .2s}
.dt-box .ico{width:1rem;height:1rem}
.dt-check input:checked+.dt-box{background:var(--accent);border-color:var(--accent);color:var(--bg)}
.dt-check input:focus-visible+.dt-box{outline:3px solid var(--primary);outline-offset:2px}
.dt-check input:checked~.dt-check__txt{color:var(--muted);text-decoration:line-through;text-decoration-color:color-mix(in oklab,var(--muted) 60%,transparent)}
.dt-check__n{display:block;color:var(--muted);margin-bottom:.15rem}
.dt-wait__note{margin-top:1.25rem;font-size:.92rem;color:var(--muted);max-width:52ch}

.dt-req{display:grid;gap:2.5rem;align-items:start}
@media (min-width:980px){.dt-req{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:4rem}.dt-req__side{position:sticky;top:6rem}}
.dt-req__side .dt-call{margin-top:1.5rem}
.dt-hints{display:grid;gap:.5rem;margin-top:2rem;padding-top:1.25rem;border-top:1px solid var(--line);color:var(--muted)}
.dt-hints li{display:flex;gap:.6rem}
.dt-hints li::before{content:"/";color:var(--pri-text);font-family:var(--mono)}
.dt-formcard{background:var(--card);color:var(--card-ink);border:1px solid var(--line);border-radius:8px;padding:0 clamp(1.1rem,3vw,2rem) clamp(1.25rem,3vw,2rem)}
.dt-formcard__top{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:0 calc(clamp(1.1rem,3vw,2rem) * -1) 1.5rem;padding:.8rem clamp(1.1rem,3vw,2rem);border-bottom:1px solid var(--line);color:var(--muted)}
.dt-rail{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;width:min(12rem,40%)}
.dt-rail i{display:block;height:4px;border-radius:2px;background:var(--line);transition:background-color .3s}
#${REQUEST_ID}:has([name="problem"]:checked) .dt-rail i:nth-child(1),#${REQUEST_ID}:has([name="urgency"]:checked) .dt-rail i:nth-child(2),#${REQUEST_ID}:has(#rq-notes:not(:placeholder-shown)) .dt-rail i:nth-child(3),#${REQUEST_ID}:has(#rq-zip:not(:placeholder-shown)) .dt-rail i:nth-child(4),#${REQUEST_ID}:has(#rq-phone:not(:placeholder-shown)) .dt-rail i:nth-child(5){background:var(--accent)}
.f-input{background:var(--bg);border-width:1px;border-radius:6px}
.f-input:focus{border-color:var(--ink);outline:none;box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 25%,transparent)}
.f-label,.f-field legend{font-weight:600;font-size:.92rem}
.f-chip>span{border-width:1px;border-radius:6px;background:var(--bg)}
.f-chip input:checked+span{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f-submit{border-radius:6px;min-height:3.4rem}
.f-urgent{border-radius:6px}
.f-status{border-width:1px;border-radius:6px;font-family:var(--mono);font-size:.9rem}
.dt-picked{font-family:var(--mono);font-size:.78rem;color:var(--muted);letter-spacing:.02em}

.dt-area{display:grid;gap:2.5rem}
@media (min-width:900px){.dt-area{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4rem}}
.dt-towns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.5rem}
.dt-towns li{padding:.5rem .8rem;border:1px solid var(--line);border-radius:6px;font-weight:500;background:var(--bg)}
.dt-towns li.is-home{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.dt-towns li.is-tbc{border-style:dashed;color:var(--muted)}
.facts{margin:0}
.facts div{display:grid;grid-template-columns:7rem minmax(0,1fr);gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--line)}
.facts div:first-child{border-top:1px solid var(--line)}
.facts dt{font-family:var(--mono);font-size:.78rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);padding-top:.2rem}
.facts dd{margin:0;font-weight:500}
.b-visit__pending{display:grid;gap:.35rem;margin-top:1.1rem;color:var(--muted);font-size:.95rem}
.dir{display:inline-flex;align-items:center;gap:.45rem;margin-top:1.25rem;font-weight:600}
.dt-photo{margin-top:2rem;border-radius:8px;overflow:hidden;aspect-ratio:16/9;background:var(--ink)}
.dt-photo .b-photo{height:100%;--photo-bg:var(--ink)}
.dt-photo img{filter:grayscale(1) contrast(1.15);mix-blend-mode:screen;opacity:.9}
.dt-photo{position:relative;isolation:isolate}
.dt-photo::after{content:"";position:absolute;inset:0;background:var(--primary);mix-blend-mode:multiply;opacity:.55;pointer-events:none}

.faq summary{font-weight:600;font-size:1.05rem}
.faq details{border-top-width:1px}
.faq details:last-child{border-bottom-width:1px}

.dt-final{background:var(--band);color:var(--on-band);padding:clamp(3.5rem,8vw,6rem) 0}
.dt-final__in{display:grid;gap:1.5rem}
.dt-final .dt-mono{color:var(--band-muted)}
.dt-final__tel{font-weight:800;font-size:clamp(2.4rem,8vw,5.5rem);line-height:1;letter-spacing:-.04em;text-decoration:none;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.dt-final__tel:hover{text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:.12em}
.dt-final .dt-link{color:var(--on-band)}

.b-ft{padding:2.5rem 0 3rem;border-top:1px solid var(--line);font-size:.95rem}
.b-ft__name{font-weight:800;font-size:1.25rem;letter-spacing:-.02em}
.b-ft__row{display:flex;flex-wrap:wrap;gap:.4rem 2rem;margin-top:.6rem;color:var(--muted);font-family:var(--mono);font-size:.82rem}
.legal{margin-top:1.5rem;color:var(--muted);font-size:.85rem}
.stock-credits{margin-top:.4rem}
.callbar{font-family:var(--mono);font-weight:500}
@media (max-width:479.98px){.b-brand{max-width:80vw}}
`;

function render(ctx) {
  const t = ctx.t;
  const stack = ctx.variants.hero === "stack";
  const verb = ctx.copyOr("ctaPrimary", ["Request service", "Pedir servicio"]);
  const chips = problemChips(ctx);
  const place = esc(ctx.cityState || ctx.placeRaw);

  const header = siteHeader(ctx, {
    cta: ["Request service", "Pedir servicio"],
    nav: [
      { href: "#services", label: ["Services", "Servicios"] },
      { href: "#visit", label: ["How a visit works", "Cómo es la visita"] },
      { href: "#area", label: ["Area and hours", "Zona y horario"] },
    ],
  });

  const callBig = callButton(ctx, { cls: "dt-call", label: ["Call", "Llamar"] });
  const toForm = `<a class="dt-link" href="#${REQUEST_ID}">${t("Or send a request", "O mande una solicitud")}${icon("arrow")}</a>`;
  const noPhoneCta = ctx.tel ? "" : `<a class="dt-call" href="#${REQUEST_ID}">${icon("arrow")}<span>${verb}</span></a>`;

  // The picker: labels that point at radios inside the form.
  const picks = chips.map((s, i) => `<label class="dt-chip" for="dt-pb-${i}">${hsGlyph(s)}<span>${esc(s)}</span></label>`).join("");
  const confirm = chips.map((s, i) => `<span data-pick="${i}">${t(`${s} picked. It is filled in on the request below.`, `${s} elegido. Ya está en la solicitud de abajo.`)}</span>`).join("");
  const card = chips.length
    ? `<div class="dt-card"><div class="dt-card__top dt-mono"><span>${t("Step 1 of 3", "Paso 1 de 3")}</span><span>${t("Pick one", "Elija uno")}</span></div><div class="dt-card__body"><h2>${t("What are you seeing?", "¿Qué está viendo?")}</h2><div class="dt-chips">${picks}</div><p class="dt-confirm" aria-live="polite">${icon("check")}<span><span data-pick="none">${t("Pick one and the request form below fills it in.", "Elija uno y el formulario de abajo lo llena.")}</span>${confirm}</span></p><div class="dt-card__foot"><span class="dt-mono">${t("Not listed? Describe it.", "¿No está? Descríbalo.")}</span><a class="dt-link" href="#${REQUEST_ID}">${t("Go to the request", "Ir a la solicitud")}${icon("arrow")}</a></div></div></div>`
    : "";

  const copy = `<div class="dt-hero__copy"><p class="dt-label dt-mono"><span class="dt-dot" aria-hidden="true"></span><b>${ctx.name}</b><span>${place}</span></p><h1 class="dt-h1">${ctx.copyOr("headline", ctx.promise)}</h1><div class="dt-side"><p class="dt-sub">${ctx.about || t("Pick what you are seeing, or call and describe it.", "Elija lo que ve, o llame y descríbalo.")}</p><div class="dt-actions">${callBig}${noPhoneCta}${ctx.tel ? toForm : ""}</div>${ratingProof(ctx, "chip")}</div></div>`;

  const hero = `<section class="dt-hero dt-hero--${stack ? "stack" : "split"}" id="top"><div class="wrap dt-hero__grid">${copy}${card}</div></section>`;

  const proofVariant = ctx.variants.proof === "numbers" ? "numbers" : "strip";
  const band = `<section class="dt-band" aria-label="Google rating"><div class="wrap dt-band__in">${ratingProof(ctx, proofVariant)}<p class="dt-band__note">${t(`What customers in ${ctx.cityRaw || "the area"} say on Google, in their own reviews.`, `Lo que dicen los clientes de ${ctx.cityRaw || "la zona"} en sus reseñas de Google.`)}</p>${ctx.tel ? `<a class="dt-band__tel" href="${esc(ctx.tel)}">${icon("phone")}<span>${esc(ctx.phone)}</span></a>` : ""}</div></section>`;

  const visit = `<section class="dt-sec" id="visit"><div class="wrap"><div class="dt-head"><h2 class="dt-h2">${t("How a visit usually works", "Cómo suele ser una visita")}</h2><p class="dt-lede">${t("The typical order of things. Details to confirm with the owner.", "El orden típico. Detalles por confirmar con el dueño.")}</p></div><ol class="dt-visit">${VISIT.map((s, i) => `<li class="rv"><span class="dt-mono">${t(`Step ${i + 1} of 4`, `Paso ${i + 1} de 4`)}</span><h3>${t(s.title[0], s.title[1])}</h3><p>${t(s.body[0], s.body[1])}</p></li>`).join("")}</ol></div></section>`;

  const services = ctx.services.length
    ? `<section class="dt-sec dt-sec--alt" id="services"><div class="wrap"><div class="dt-head"><h2 class="dt-h2">${t("What people call about", "Por qué llama la gente")}</h2><p class="dt-lede">${t("Find the closest match. If nothing fits, describe it in the request.", "Busque lo más parecido. Si nada queda, descríbalo en la solicitud.")}</p></div><ul class="dt-svc">${ctx.services.map((s) => { const b = hsBlurb(s); return `<li class="rv">${hsGlyph(s)}<h3>${esc(s)}</h3><p>${t(b[0], b[1])}</p><a href="#${REQUEST_ID}">${t("Request", "Pedir")}</a></li>`; }).join("")}</ul>${servicesConfirm(ctx)}</div></section>`
    : "";

  const themes = themesBlock(ctx);
  const why = themes
    ? `<section class="dt-sec"><div class="wrap dt-why"><div class="dt-head"><h2 class="dt-h2">${t("Why customers call", "Por qué llaman los clientes")}</h2><p class="dt-lede">${t("Themes that come up again and again in Google reviews.", "Temas que se repiten en las reseñas de Google.")}</p></div><div>${themes}</div></div></section>`
    : "";

  const steps = whileYouWait(ctx);
  const wait = `<section class="dt-sec ${themes ? "dt-sec--alt" : ""}" id="wait"><div class="wrap dt-wait"><div class="dt-head"><h2 class="dt-h2">${t("While you wait", "Mientras espera")}</h2><p class="dt-lede">${t("General safety steps for this kind of problem. Tick them off as you go.", "Pasos generales de seguridad para este tipo de problema. Márquelos al avanzar.")}</p><p class="dt-wait__note">${t("General guidance only, not instructions from the business. If anything feels unsafe, leave and call 911.", "Solo guía general, no instrucciones del negocio. Si algo se siente peligroso, salga y llame al 911.")}</p></div><div class="dt-check" role="group"${ctx.i18n.aria("While you wait checklist", "Lista mientras espera")}>${steps.map((s, i) => `<label><input type="checkbox"><span class="dt-box">${icon("check")}</span><span class="dt-check__txt"><span class="dt-check__n dt-mono">${String(i + 1).padStart(2, "0")}</span>${t(s[0], s[1])}</span></label>`).join("")}</div></div></section>`;

  // The form gets the picker's radios at its top.
  const pickField = chips.length
    ? `<fieldset class="f-field"><legend>${t("What is it about?", "¿De qué se trata?")}</legend><div class="f-chips">${chips.map((s, i) => `<label class="f-chip"><input type="radio" name="problem" id="dt-pb-${i}" value="${esc(s)}"><span>${esc(s)}</span></label>`).join("")}<label class="f-chip"><input type="radio" name="problem" value="other"><span>${t("Something else", "Otra cosa")}</span></label></div><p class="dt-picked">${t("Picked from the list at the top? It is already marked here.", "¿Lo eligió arriba? Ya está marcado aquí.")}</p></fieldset>`
    : "";
  const form = formHeading(ctx);
  const request = `<section class="dt-sec" id="${REQUEST_ID}"><div class="wrap dt-req"><div class="dt-req__side"><h2 class="dt-h2">${form.title}</h2><p class="dt-lede">${form.intro}</p>${callButton(ctx, { cls: "dt-call", label: ["Call", "Llamar"] })}<ul class="dt-hints dt-mono"><li>${t("Happening now? Calling is fastest.", "¿Pasa ahora? Llamar es lo más rápido.")}</li><li>${t("Photos help. Have a few ready.", "Las fotos ayudan. Tenga unas a la mano.")}</li><li>${t("Nothing is sent from this concept.", "Este concepto no envía nada.")}</li></ul></div><div class="dt-formcard"><div class="dt-formcard__top dt-mono"><span>${t("Service request", "Solicitud de servicio")}</span><span class="dt-rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>${formWith(ctx, { id: "dt-form", prepend: pickField })}</div></div></section>`;

  const photo = ctx.photos.next((p) => /condenser|panel|valve/.test(p.id));
  const photoHtml = photo ? `<div class="dt-photo">${ctx.photos.img(photo, { sizes: "(min-width: 900px) 45vw, 100vw", width: 1200 })}</div>` : "";
  const area = `<section class="dt-sec dt-sec--alt" id="area"><div class="wrap dt-area"><div><h2 class="dt-h2">${t("Service area and hours", "Zona de servicio y horario")}</h2><p class="dt-lede">${t(`Based in ${ctx.placeRaw}. The full list of towns is to confirm with the owner.`, `Con base en ${ctx.placeRaw}. La lista completa de zonas está por confirmar con el dueño.`)}</p><ul class="dt-towns"><li class="is-home">${esc(ctx.cityRaw || ctx.placeRaw)}</li><li class="is-tbc">${t("Nearby towns to confirm", "Zonas cercanas por confirmar")}</li></ul>${photoHtml}</div>${visitDetails(ctx)}</div></section>`;

  const faq = `<section class="dt-sec" id="faq"><div class="wrap dt-why"><div class="dt-head"><h2 class="dt-h2">${t("Questions before you call", "Preguntas antes de llamar")}</h2></div>${faqBlock(ctx)}</div></section>`;

  const final = `<section class="dt-final"><div class="wrap dt-final__in"><p class="dt-mono">${ctx.name} · ${place}</p>${ctx.tel ? `<a class="dt-final__tel" href="${esc(ctx.tel)}">${esc(ctx.phone)}</a>` : `<p class="dt-final__tel">${verb}</p>`}<a class="dt-link" href="#${REQUEST_ID}">${verb}${icon("arrow")}</a></div></section>`;

  return {
    css: CSS,
    body: `${header}<main>${hero}${band}${visit}${services}${why}${wait}${request}${area}${faq}${final}</main>${siteFooter(ctx)}`,
  };
}

export const direction = {
  key: "hs-dispatch-triage",
  label: "Dispatch triage",
  status: "implemented",
  suits: ["plumbing", "hvac", "electrical", "appliance-repair", "garage-door", "septic"],
  keywords: ["emergency", "24/7", "fast", "repair-first", "emergency-first", "triage"],
  fontsHref: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap",
  palettes: PALETTES,
  variants: { hero: ["split", "stack"], services: ["columns"], proof: ["strip", "numbers"] },
  imagery: { photos: true, people: ["none", "hands"], heroPeople: ["none"], heroPrefer: /condenser|panel|valve/ },
  callbar: "call",
  render,
};
