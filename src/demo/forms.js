// Request forms, one per vertical flavor. Every form is demo only: it carries
// data-demo-form, has no action, and the page script answers a submit with the
// concept notice. Photo inputs preview on the device and are never uploaded.

import { DEMO_SENT_MESSAGE, DEMO_SENT_MESSAGE_ES, esc, icon } from "./shared.js";

// Pick the form that matches how a customer of this business actually reaches out.
export function formKindFor(vertical, categoryKey) {
  if (vertical === "auto") {
    if (categoryKey === "auto-body-collision" || categoryKey === "auto-detailing") return "photo-estimate";
    if (categoryKey === "tire-shop") return "tire-quote";
    if (categoryKey === "towing" || categoryKey === "diesel-truck-repair" || categoryKey === "mobile-mechanic") return "roadside";
    return "repair-estimate";
  }
  if (vertical === "home-services") return "emergency";
  if (vertical === "contractor") return "estimate";
  if (vertical === "personal-care") return "booking";
  return "request";
}

// Section heading, intro and the matching call to action for each kind.
export const FORM_COPY = {
  "photo-estimate": {
    title: ["Get a photo estimate", "Presupuesto con fotos"],
    intro: ["Snap the damage and add a few details, so the shop can talk through a starting number.", "Tome fotos del daño y agregue unos detalles para que el taller pueda platicarle un número inicial."],
    cta: ["Send photos for an estimate", "Mandar fotos para presupuesto"],
  },
  "repair-estimate": {
    title: ["Request an estimate", "Pida un presupuesto"],
    intro: ["Describe what the car is doing. The shop follows up to talk it through.", "Describa qué hace el carro. El taller le contacta para platicarlo."],
    cta: ["Request an estimate", "Pedir presupuesto"],
  },
  "tire-quote": {
    title: ["Ask about your tire size", "Pregunte por su medida"],
    intro: ["Send your size and how many you need. The shop checks what fits and calls you back.", "Mande su medida y cuántas necesita. El taller revisa qué le queda y le regresa la llamada."],
    cta: ["Check my tire size", "Revisar mi medida"],
  },
  roadside: {
    title: ["Stuck somewhere?", "¿Se quedó varado?"],
    intro: ["Calling is fastest. If you cannot talk right now, send your location and what happened.", "Llamar es lo más rápido. Si no puede hablar ahora, mande su ubicación y qué pasó."],
    cta: ["Request help on the road", "Pedir ayuda en camino"],
  },
  emergency: {
    title: ["Tell us what is going on", "Cuéntenos qué pasa"],
    intro: ["Say whether it is happening now or you are planning ahead. Either way, the details help.", "Indique si está pasando ahora o si está planeando. En ambos casos, los detalles ayudan."],
    cta: ["Send a service request", "Enviar solicitud de servicio"],
  },
  estimate: {
    title: ["Request an estimate", "Solicite un presupuesto"],
    intro: ["Share the project, a rough size and your timeline. Photos help if you have them.", "Comparta el proyecto, un tamaño aproximado y sus tiempos. Las fotos ayudan si las tiene."],
    cta: ["Start my estimate", "Empezar mi presupuesto"],
  },
  booking: {
    title: ["Book a time", "Reserve su hora"],
    intro: ["Pick a service and a time that works. Requests are confirmed before they are final.", "Elija un servicio y un horario. Las solicitudes se confirman antes de quedar fijas."],
    cta: ["Book a time", "Reservar"],
  },
  request: {
    title: ["Send a request", "Envíe una solicitud"],
    intro: ["A few details now make the first call quicker.", "Unos detalles ahora hacen más rápida la primera llamada."],
    cta: ["Send a request", "Enviar solicitud"],
  },
};

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

// The next seven days after `now`, in UTC so a render is identical on any machine.
export function nextDays(now, count = 7) {
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = [];
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(base + i * 86400000);
    days.push({
      value: d.toISOString().slice(0, 10),
      en: WEEKDAYS_EN[d.getUTCDay()],
      es: WEEKDAYS_ES[d.getUTCDay()],
      date: d.getUTCDate(),
    });
  }
  return days;
}

function field(id, label, control, hint) {
  return `<div class="f-field"><label class="f-label" for="${id}">${label}</label>${control}${hint ? `<p class="f-hint">${hint}</p>` : ""}</div>`;
}

function chips(i18n, name, legend, options, extra = "") {
  const items = options
    .map((o) => `<label class="f-chip"><input type="radio" name="${name}" value="${esc(o.value)}"${o.urgent ? " data-urgent" : ""}><span>${i18n.t(o.en, o.es)}</span></label>`)
    .join("");
  return `<fieldset class="f-field"><legend>${legend}</legend><div class="f-chips">${items}</div>${extra}</fieldset>`;
}

function contactRow(i18n) {
  return `<div class="f-row">${field("rq-name", i18n.t("Your name", "Su nombre"), `<input class="f-input" id="rq-name" name="name" type="text" autocomplete="name"${i18n.placeholder("First and last", "Nombre y apellido")}>`)}${field("rq-phone", i18n.t("Best phone", "Mejor teléfono"), `<input class="f-input" id="rq-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel"${i18n.placeholder("Where to reach you", "Dónde localizarle")}>`)}</div>`;
}

function vehicleField(i18n) {
  return field("rq-vehicle", i18n.t("Vehicle", "Vehículo"), `<input class="f-input" id="rq-vehicle" name="vehicle" type="text"${i18n.placeholder("Year, make and model", "Año, marca y modelo")}>`);
}

function photoField(i18n, label, hint) {
  return `<div class="f-field"><span class="f-label" id="rq-photos-label">${label}</span><div class="f-drop">${icon("camera")}<strong>${i18n.t("Tap to add photos", "Toque para agregar fotos")}</strong><span class="f-hint">${hint}</span><input type="file" id="rq-photos" name="photos" accept="image/*" multiple aria-labelledby="rq-photos-label" data-photo-input="rq-previews"></div><div class="f-previews" id="rq-previews" aria-live="polite"></div></div>`;
}

function serviceSelect(i18n, services, label) {
  const opts = services.map((s) => `<option>${esc(s)}</option>`).join("");
  return field("rq-service", label, `<select class="f-input" id="rq-service" name="service"><option value=""${i18n.ti("Choose one", "Elija uno")}>Choose one</option>${opts}<option value="other"${i18n.ti("Something else", "Otra cosa")}>Something else</option></select>`);
}

function notesField(i18n, label, ph) {
  return field("rq-notes", label, `<textarea class="f-input" id="rq-notes" name="notes" rows="4"${i18n.placeholder(ph[0], ph[1])}></textarea>`);
}

function zipField(i18n) {
  return field("rq-zip", i18n.t("ZIP code", "Código postal"), `<input class="f-input" id="rq-zip" name="zip" type="text" inputmode="numeric" autocomplete="postal-code"${i18n.placeholder("So they know the area", "Para ubicar la zona")}>`);
}

function kindFields(kind, ctx) {
  const i18n = ctx.i18n;
  const t = i18n.t.bind(i18n);
  switch (kind) {
    case "photo-estimate":
      return [
        photoField(i18n, t("Photos of the damage", "Fotos del daño"), t("One wide shot, then close ups. Photos stay on your device in this concept.", "Una foto amplia y luego de cerca. En este concepto las fotos se quedan en su equipo.")),
        chips(i18n, "area", t("Where is the damage?", "¿Dónde está el daño?"), [
          { value: "front", en: "Front", es: "Frente" },
          { value: "rear", en: "Rear", es: "Atrás" },
          { value: "driver", en: "Driver side", es: "Lado del conductor" },
          { value: "passenger", en: "Passenger side", es: "Lado del pasajero" },
          { value: "top", en: "Roof or hood", es: "Techo o cofre" },
          { value: "unsure", en: "Not sure", es: "No sé" },
        ]),
        vehicleField(i18n),
        contactRow(i18n),
        notesField(i18n, t("Anything else?", "¿Algo más?"), ["What happened, and when you need the car back", "Qué pasó y cuándo necesita el carro"]),
      ];
    case "repair-estimate":
      return [
        vehicleField(i18n),
        notesField(i18n, t("What is it doing?", "¿Qué está haciendo?"), ["A noise, a warning light, when it started", "Un ruido, una luz de aviso, cuándo empezó"]),
        chips(i18n, "timing", t("When works for you?", "¿Cuándo le queda bien?"), [
          { value: "this-week", en: "This week", es: "Esta semana" },
          { value: "next-week", en: "Next week", es: "La próxima semana" },
          { value: "quote", en: "Just a quote for now", es: "Solo un presupuesto" },
        ]),
        contactRow(i18n),
      ];
    case "tire-quote":
      return [
        `<div class="f-row">${field("rq-size", t("Tire size", "Medida de llanta"), `<input class="f-input" id="rq-size" name="size" type="text" autocapitalize="characters"${i18n.placeholder("For example 225/65R17", "Por ejemplo 225/65R17")}>`, t("It is printed on the sidewall of the tire.", "Viene impresa en el costado de la llanta."))}${vehicleField(i18n)}</div>`,
        chips(i18n, "qty", t("How many?", "¿Cuántas?"), [
          { value: "1", en: "1", es: "1" },
          { value: "2", en: "2", es: "2" },
          { value: "4", en: "4", es: "4" },
          { value: "unsure", en: "Not sure yet", es: "Todavía no sé" },
        ]),
        contactRow(i18n),
      ];
    case "roadside":
      return [
        field("rq-where", t("Where are you?", "¿Dónde está?"), `<input class="f-input" id="rq-where" name="where" type="text"${i18n.placeholder("Highway, exit or cross streets", "Carretera, salida o calles")}>`),
        chips(i18n, "issue", t("What happened?", "¿Qué pasó?"), [
          { value: "no-start", en: "Will not start", es: "No arranca" },
          { value: "tire", en: "Flat or blowout", es: "Llanta ponchada" },
          { value: "heat", en: "Overheating", es: "Se calienta" },
          { value: "warning", en: "Warning light", es: "Luz de aviso" },
          { value: "other", en: "Something else", es: "Otra cosa" },
        ]),
        chips(i18n, "vehicle", t("What are you driving?", "¿Qué maneja?"), [
          { value: "semi", en: "Semi truck", es: "Tráiler" },
          { value: "box", en: "Box truck", es: "Camión de caja" },
          { value: "pickup", en: "Pickup", es: "Pickup" },
          { value: "car", en: "Car or SUV", es: "Carro o camioneta" },
        ]),
        contactRow(i18n),
      ];
    case "emergency":
      return [
        chips(i18n, "urgency", t("Is it happening right now?", "¿Está pasando ahora?"), [
          { value: "now", en: "Yes, right now", es: "Sí, ahora mismo", urgent: true },
          { value: "soon", en: "It can wait a day or two", es: "Puede esperar uno o dos días" },
          { value: "planning", en: "Planning ahead", es: "Estoy planeando" },
        ], ctx.tel ? `<div class="f-urgent">${icon("alert")}<span>${t("For anything happening now, calling is fastest.", "Si está pasando ahora, llamar es lo más rápido.")}</span><a href="${esc(ctx.tel)}">${t("Call", "Llamar")} ${esc(ctx.phone)}</a></div>` : ""),
        notesField(i18n, t("What are you seeing or hearing?", "¿Qué ve o escucha?"), ["Where in the house, and when it started", "En qué parte de la casa y cuándo empezó"]),
        `<div class="f-row">${zipField(i18n)}${field("rq-when", t("Best time to call back", "Mejor hora para llamarle"), `<select class="f-input" id="rq-when" name="when"><option${i18n.ti("As soon as possible", "Lo antes posible")}>As soon as possible</option><option${i18n.ti("Morning", "Mañana")}>Morning</option><option${i18n.ti("Afternoon", "Tarde")}>Afternoon</option><option${i18n.ti("Evening", "Noche")}>Evening</option></select>`)}</div>`,
        contactRow(i18n),
      ];
    case "estimate":
      return [
        ctx.services.length ? serviceSelect(i18n, ctx.services, t("Type of project", "Tipo de proyecto")) : "",
        `<div class="f-row">${field("rq-size", t("Rough size", "Tamaño aproximado"), `<input class="f-input" id="rq-size" name="size" type="text"${i18n.placeholder("Square feet, length, or describe it", "Pies cuadrados, largo, o descríbalo")}>`)}${zipField(i18n)}</div>`,
        chips(i18n, "timeline", t("Timeline", "Tiempos"), [
          { value: "soon", en: "As soon as possible", es: "Lo antes posible" },
          { value: "months", en: "In the next few months", es: "En los próximos meses" },
          { value: "exploring", en: "Just exploring", es: "Solo explorando" },
        ]),
        photoField(i18n, t("Photos of the area", "Fotos del área"), t("Optional. They stay on your device in this concept.", "Opcional. En este concepto se quedan en su equipo.")),
        contactRow(i18n),
        notesField(i18n, t("Anything else?", "¿Algo más?"), ["What you have in mind", "Lo que tiene en mente"]),
      ];
    case "booking": {
      const days = ctx.days
        .map((d) => `<label class="f-chip day"><input type="radio" name="day" value="${d.value}"><span><small>${i18n.t(d.en, d.es)}</small><b>${d.date}</b></span></label>`)
        .join("");
      return [
        ctx.services.length ? serviceSelect(i18n, ctx.services, t("Service", "Servicio")) : "",
        `<fieldset class="f-field"><legend>${t("Day", "Día")}</legend><div class="f-chips">${days}</div></fieldset>`,
        chips(i18n, "time", t("Time of day", "Hora del día"), [
          { value: "morning", en: "Morning", es: "Mañana" },
          { value: "afternoon", en: "Afternoon", es: "Tarde" },
          { value: "evening", en: "Evening", es: "Noche" },
        ]),
        contactRow(i18n),
      ];
    }
    default:
      return [
        ctx.services.length ? serviceSelect(i18n, ctx.services, t("What do you need?", "¿Qué necesita?")) : "",
        notesField(i18n, t("Tell them a little more", "Cuente un poco más"), ["A few details help", "Unos detalles ayudan"]),
        chips(i18n, "timing", t("When?", "¿Cuándo?"), [
          { value: "soon", en: "This week", es: "Esta semana" },
          { value: "later", en: "Later this month", es: "Más adelante este mes" },
          { value: "exploring", en: "Just asking", es: "Solo pregunto" },
        ]),
        contactRow(i18n),
      ];
  }
}

export function requestForm(kind, ctx) {
  const i18n = ctx.i18n;
  const copy = FORM_COPY[kind] || FORM_COPY.request;
  const cta = i18n.t(copy.cta[0], copy.cta[1]);
  return `<form class="req-form" data-demo-form data-form-kind="${esc(kind)}" novalidate${i18n.aria("Request form", "Formulario de solicitud")}>
${kindFields(kind, ctx).filter(Boolean).join("\n")}
<button class="f-submit" type="submit">${cta}${icon("arrow")}</button>
<p class="f-status" data-demo-status tabindex="-1" role="status" hidden>${i18n.t(DEMO_SENT_MESSAGE, DEMO_SENT_MESSAGE_ES)}</p>
</form>`;
}
