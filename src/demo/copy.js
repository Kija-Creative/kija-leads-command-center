// Chrome copy every direction can use: promises, visit steps and FAQs, in
// English and Spanish. None of it states a fact about a business; it describes
// how a visit or request usually goes and tells the visitor to ask or call.
// A direction may write its own lines instead, under the same rules.

const PROMISE_BY_CATEGORY = {
  barber: ["Sit down. Look sharp. Book your chair.", "Siéntese. Salga impecable. Reserve su silla."],
  "hair-salon": ["Book the chair. Leave feeling like yourself.", "Reserve su silla. Salga sintiéndose usted."],
  "nail-salon": ["Pick your set. Pick your time. Done.", "Elija su diseño. Elija su hora. Listo."],
  tattoo: ["Bring the idea. Book the consult.", "Traiga la idea. Reserve su consulta."],
  "pet-grooming": ["Book the groom. Bring the good dog.", "Reserve el baño. Traiga a su perrito."],
  septic: ["When something backs up, start here.", "Cuando algo se tapa, empiece aquí."],
  plumbing: ["Leak, clog or no hot water? Start here.", "¿Fuga, tapón o sin agua caliente? Empiece aquí."],
  hvac: ["Too hot, too cold, or just not right? Start here.", "¿Mucho calor, mucho frío o algo no está bien? Empiece aquí."],
  electrical: ["Lights flickering or power out? Start here.", "¿Luces que parpadean o sin luz? Empiece aquí."],
  "garage-door": ["Door stuck, loud or off track? Start here.", "¿La puerta atorada, ruidosa o fuera de riel? Empiece aquí."],
  restoration: ["Water, fire or mold damage? Start here.", "¿Daño por agua, fuego o moho? Empiece aquí."],
  "appliance-repair": ["Washer, fridge or oven acting up? Start here.", "¿La lavadora, el refri o la estufa fallan? Empiece aquí."],
  "pest-control": ["Seeing pests where you should not? Start here.", "¿Ve plagas donde no debería? Empiece aquí."],
  roofing: ["Before the next storm, get eyes on your roof.", "Antes de la próxima tormenta, revise su techo."],
  concrete: ["Concrete work starts with a clear estimate.", "El trabajo de concreto empieza con un presupuesto claro."],
  fencing: ["A good fence starts with a clear estimate.", "Una buena cerca empieza con un presupuesto claro."],
  pools: ["The backyard you want starts with a conversation.", "El patio que quiere empieza con una plática."],
  landscaping: ["A yard you love starts with a walk around it.", "Un jardín que le encante empieza con un recorrido."],
  painting: ["A fresh coat starts with a clear estimate.", "Una mano de pintura nueva empieza con un presupuesto claro."],
  "foundation-repair": ["Cracks and sticking doors are worth a look. Start here.", "Grietas y puertas que se atoran merecen una revisión. Empiece aquí."],
  remodeling: ["The room you keep picturing starts with a plan.", "El cuarto que se imagina empieza con un plan."],
  "tree-service": ["Worried about a big tree? Start with an estimate.", "¿Le preocupa un árbol grande? Empiece con un presupuesto."],
};

// Auto promises follow how the customer reaches out, which is the form kind.
const PROMISE_BY_KIND = {
  "repair-estimate": ["Tell us what it is doing. We will tell you what it needs.", "Cuéntenos qué le pasa. Le diremos qué necesita."],
  "photo-estimate": ["Send a few photos. Get a straight read on the damage.", "Mande unas fotos. Reciba una opinión clara del daño."],
  "tire-quote": ["Tell us your tire size. We will check what fits.", "Díganos la medida de su llanta. Revisamos qué le queda."],
  roadside: ["Broken down? Call first. Everything else can wait.", "¿Se descompuso? Llame primero. Lo demás puede esperar."],
};

const PROMISE_BY_VERTICAL = {
  "home-services": ["Something not working at home? Start with one call.", "¿Algo no funciona en casa? Empiece con una llamada."],
  contractor: ["Big projects start with a clear estimate.", "Los proyectos grandes empiezan con un presupuesto claro."],
  "personal-care": ["Book your time in a few taps.", "Reserve su hora en unos toques."],
};
const PROMISE_DEFAULT = ["One call gets it started.", "Una llamada y empezamos."];

export function promiseFor(ctx) {
  if (ctx.vertical === "auto" && PROMISE_BY_KIND[ctx.kind]) return PROMISE_BY_KIND[ctx.kind];
  return PROMISE_BY_CATEGORY[ctx.categoryKey] || PROMISE_BY_VERTICAL[ctx.vertical] || PROMISE_DEFAULT;
}

const STEPS = {
  "repair-estimate": [
    { title: ["Call or send a request", "Llame o mande una solicitud"], body: ["Tell the shop what the car is doing and when it started.", "Dígale al taller qué hace el carro y cuándo empezó."] },
    { title: ["Get a clear plan", "Reciba un plan claro"], body: ["Ask what it needs and what it costs before you say yes.", "Pregunte qué necesita y cuánto cuesta antes de decir que sí."] },
    { title: ["Back on the road", "De vuelta al camino"], body: ["Pick up your car and get on with your day.", "Recoja su carro y siga con su día."] },
  ],
  "photo-estimate": [
    { title: ["Send photos", "Mande fotos"], body: ["Wide shots and close ups of the damage, taken in daylight.", "Fotos amplias y de cerca del daño, con luz de día."] },
    { title: ["Get a starting number", "Reciba un número inicial"], body: ["A first estimate based on what the photos show.", "Un primer presupuesto con base en lo que muestran las fotos."] },
    { title: ["Bring it in", "Tráigalo"], body: ["Schedule the repair and a final look in person.", "Agende la reparación y una revisión final en persona."] },
  ],
  "tire-quote": [
    { title: ["Send your size", "Mande su medida"], body: ["It is printed on the sidewall of the tire.", "Viene impresa en el costado de la llanta."] },
    { title: ["Hear what fits", "Sepa qué le queda"], body: ["Talk through options for your size and budget.", "Platique opciones para su medida y presupuesto."] },
    { title: ["Stop by", "Pase al taller"], body: ["Come in for the install and get back on the road.", "Venga para la instalación y vuelva al camino."] },
  ],
  roadside: [
    { title: ["Call", "Llame"], body: ["Say where you are and what happened.", "Diga dónde está y qué pasó."] },
    { title: ["Stay safe", "Manténgase a salvo"], body: ["Pull off the road and turn your hazards on.", "Oríllese y prenda las intermitentes."] },
    { title: ["Get the next step", "Siga el siguiente paso"], body: ["Ask what can be done where you are and what comes next.", "Pregunte qué se puede hacer donde está y qué sigue."] },
  ],
  emergency: [
    { title: ["Call or send a request", "Llame o mande una solicitud"], body: ["Describe what you are seeing and where in the house.", "Describa lo que ve y en qué parte de la casa."] },
    { title: ["Talk it through", "Platíquelo"], body: ["Get a sense of the problem and the next step.", "Entienda el problema y el siguiente paso."] },
    { title: ["Schedule the visit", "Agende la visita"], body: ["Pick a time that works for the household.", "Elija un horario que le funcione a la casa."] },
  ],
  estimate: [
    { title: ["Request an estimate", "Pida un presupuesto"], body: ["Share the project, a rough size and your timing.", "Comparta el proyecto, un tamaño aproximado y sus tiempos."] },
    { title: ["Talk it through", "Platíquelo"], body: ["Go over options, and ask about a visit to measure.", "Revisen opciones y pregunte por una visita para medir."] },
    { title: ["Plan and price", "Plan y precio"], body: ["A scope and a price you can compare.", "Un alcance y un precio que puede comparar."] },
    { title: ["Build", "Obra"], body: ["The work gets scheduled and done.", "El trabajo se agenda y se hace."] },
  ],
  booking: [
    { title: ["Pick a service", "Elija un servicio"], body: ["Choose from the menu or ask for something else.", "Escoja del menú o pida otra cosa."] },
    { title: ["Choose a time", "Elija un horario"], body: ["Pick a day and the part of the day that works.", "Elija un día y la hora que le funcione."] },
    { title: ["Take a seat", "Tome asiento"], body: ["Show up, sit back, and leave looking right.", "Llegue, relájese y salga como quiere."] },
  ],
  tattoo: [
    { title: ["Share your idea", "Comparta su idea"], body: ["Size, placement and a few reference images.", "Tamaño, lugar y unas imágenes de referencia."] },
    { title: ["Book the consult", "Reserve la consulta"], body: ["Talk it through and settle the design.", "Platíquelo y definan el diseño."] },
    { title: ["Sit for it", "Su sesión"], body: ["Come in rested and ready on the day.", "Venga descansado y listo ese día."] },
    { title: ["Aftercare", "Cuidados"], body: ["Follow the aftercare the artist gives you.", "Siga los cuidados que le indique el artista."] },
  ],
  "pet-grooming": [
    { title: ["Tell us about your pet", "Cuéntenos de su mascota"], body: ["Breed, size, coat and anything that makes them nervous.", "Raza, tamaño, pelo y lo que le ponga nervioso."] },
    { title: ["Pick a day", "Elija un día"], body: ["Choose a drop off day that works.", "Elija un día para dejarlo."] },
    { title: ["Drop off", "Déjelo"], body: ["Share any notes in person at drop off.", "Comparta sus notas en persona al dejarlo."] },
    { title: ["Pick up a clean pup", "Recoja a su mascota"], body: ["Come back at pick up time.", "Regrese a la hora de recogerlo."] },
  ],
  request: [
    { title: ["Reach out", "Comuníquese"], body: ["Call or send a quick request.", "Llame o mande una solicitud rápida."] },
    { title: ["Talk it through", "Platíquelo"], body: ["Share what you need and when.", "Comparta qué necesita y cuándo."] },
    { title: ["Get it done", "Listo"], body: ["Settle the details and set a time.", "Definan los detalles y el horario."] },
  ],
};

export function stepsFor(ctx) {
  return STEPS[ctx.categoryKey] || STEPS[ctx.kind] || STEPS.request;
}

const FAQ_APPOINTMENT = { q: ["Do I need an appointment?", "¿Necesito cita?"], a: ["Call ahead to check today's schedule and the quickest way in.", "Llame antes para revisar la agenda del día y la forma más rápida de atenderle."] };

const FAQ_BY_KIND = {
  "repair-estimate": [
    { q: ["Can I get a price before any work starts?", "¿Me pueden dar precio antes de empezar?"], a: ["Ask for one. Call or send the request form and say you would like a quote first.", "Pídalo. Llame o mande el formulario y diga que quiere un presupuesto primero."] },
    FAQ_APPOINTMENT,
    { q: ["What should I have ready when I call?", "¿Qué debo tener a la mano cuando llame?"], a: ["The year, make and model, what the car is doing, and when it started. A short video of a noise helps.", "Año, marca y modelo, qué hace el carro y cuándo empezó. Un video corto del ruido ayuda."] },
  ],
  "photo-estimate": [
    { q: ["What photos help most?", "¿Qué fotos ayudan más?"], a: ["One wide shot of the whole side in daylight, then close ups of each damaged area.", "Una foto amplia de todo el lado con luz de día y luego de cerca de cada daño."] },
    { q: ["Is a photo estimate final?", "¿El presupuesto con fotos es final?"], a: ["Photos give a starting point. Expect the final number after an in person look.", "Las fotos dan un punto de partida. El número final viene después de revisarlo en persona."] },
    { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Your vehicle details and, if you filed a claim, the claim number.", "Los datos de su vehículo y, si abrió un reclamo, el número de reclamo."] },
  ],
  "tire-quote": [
    { q: ["Where do I find my tire size?", "¿Dónde encuentro la medida?"], a: ["On the sidewall, a code like 225/65R17. It is also on a sticker inside the driver door.", "En el costado de la llanta, un código como 225/65R17. También viene en una etiqueta en la puerta del conductor."] },
    FAQ_APPOINTMENT,
    { q: ["Can I bring my own tires?", "¿Puedo traer mis propias llantas?"], a: ["Ask when you call so the shop can plan for it.", "Pregunte cuando llame para que el taller lo tenga en cuenta."] },
  ],
  roadside: [
    { q: ["What should I say when I call?", "¿Qué digo cuando llame?"], a: ["Where you are, what you are driving, and what happened. Then wait somewhere safe.", "Dónde está, qué maneja y qué pasó. Luego espere en un lugar seguro."] },
    { q: ["Can the repair happen where I am?", "¿Se puede reparar donde estoy?"], a: ["It depends on the problem. Describe it on the phone and ask.", "Depende del problema. Descríbalo por teléfono y pregunte."] },
    { q: ["What if I cannot talk right now?", "¿Y si no puedo hablar ahora?"], a: ["Send the short form with your location and a number to reach you.", "Mande el formulario corto con su ubicación y un número para localizarle."] },
  ],
  emergency: [
    { q: ["What counts as an emergency?", "¿Qué cuenta como emergencia?"], a: ["Anything causing damage right now, or anything that feels unsafe. When in doubt, call and describe it.", "Cualquier cosa que esté causando daño ahora o que se sienta peligrosa. Si tiene duda, llame y descríbalo."] },
    { q: ["Can I get a quote before work starts?", "¿Me pueden dar precio antes de empezar?"], a: ["Ask when you call. A clear description and a few photos help.", "Pregunte cuando llame. Una descripción clara y unas fotos ayudan."] },
    { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Your address, what you are seeing or hearing, and when it started.", "Su dirección, lo que ve o escucha y cuándo empezó."] },
    { q: ["What if it feels dangerous?", "¿Y si se siente peligroso?"], a: ["If you smell gas or see sparks, get everyone out and call 911 first.", "Si huele a gas o ve chispas, salga de la casa con todos y llame primero al 911."] },
  ],
  estimate: [
    { q: ["How does an estimate work?", "¿Cómo funciona un presupuesto?"], a: ["Share the project and a rough size. The usual next step is a visit to measure and talk through options.", "Comparta el proyecto y un tamaño aproximado. Lo normal después es una visita para medir y platicar opciones."] },
    { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["Photos of the area, rough measurements if you have them, and your timeline.", "Fotos del área, medidas aproximadas si las tiene y sus tiempos."] },
    { q: ["How soon can work start?", "¿Qué tan pronto pueden empezar?"], a: ["It depends on the project and the season. Ask when you request an estimate.", "Depende del proyecto y la temporada. Pregunte cuando pida su presupuesto."] },
  ],
  request: [
    { q: ["How do I get started?", "¿Cómo empiezo?"], a: ["Call or send a request with a few details.", "Llame o mande una solicitud con unos detalles."] },
    { q: ["What should I have ready?", "¿Qué debo tener a la mano?"], a: ["What you need, where, and when. Photos help if it is something worth seeing.", "Qué necesita, dónde y cuándo. Las fotos ayudan si es algo que conviene ver."] },
    { q: ["Can I get a price first?", "¿Me pueden dar precio primero?"], a: ["Ask when you call. The more detail you share, the clearer the answer.", "Pregunte cuando llame. Entre más detalles comparta, más clara la respuesta."] },
  ],
};

const FAQ_EXTRA = {
  septic: { q: ["How often should a septic tank be pumped?", "¿Cada cuánto se debe vaciar una fosa séptica?"], a: ["It depends on the tank size and how many people live in the home. Ask for a recommendation for yours.", "Depende del tamaño de la fosa y de cuántas personas viven en la casa. Pida una recomendación para la suya."] },
  roofing: { q: ["Should a roof get a look after a storm?", "¿Conviene revisar el techo después de una tormenta?"], a: ["If you see missing shingles, leaks or dents, it is worth a look. Take photos from the ground and call.", "Si ve tejas faltantes, goteras o golpes, vale la pena revisarlo. Tome fotos desde el suelo y llame."] },
};

const BRING = {
  barber: ["A photo of the cut you want helps.", "Una foto del corte que quiere ayuda."],
  "hair-salon": ["A photo of the look you want helps.", "Una foto del look que quiere ayuda."],
  "nail-salon": ["Inspiration photos for the set you want.", "Fotos de inspiración del diseño que quiere."],
  tattoo: ["Reference images, plus the size and placement you have in mind.", "Imágenes de referencia y el tamaño y lugar que tiene en mente."],
  "pet-grooming": ["Vaccination records and any notes about coat or temperament.", "El registro de vacunas y cualquier nota sobre el pelo o el carácter."],
};

function bookingFaq(key) {
  const base = [
    { q: ["Do you take walk ins?", "¿Atienden sin cita?"], a: ["Call to check. Booking ahead is the surest way to get the time you want.", "Llame para confirmar. Reservar antes es la forma más fácil de conseguir su horario."] },
    { q: ["How do I change a booking?", "¿Cómo cambio mi cita?"], a: ["Call with as much notice as you can.", "Llame con toda la anticipación que pueda."] },
    { q: ["What should I bring?", "¿Qué debo traer?"], a: BRING[key] || ["Just yourself and any questions you have.", "Solo usted y sus preguntas."] },
  ];
  // Generic studio and groomer questions; they describe common practice, not this business.
  if (key === "tattoo") base.push({ q: ["Is there an age requirement?", "¿Hay edad mínima?"], a: ["Most studios tattoo adults only and ask for a photo ID. Ask the studio about its policy.", "La mayoría de los estudios solo tatúa a adultos y pide identificación con foto. Pregunte al estudio por su política."] });
  if (key === "pet-grooming") base.push({ q: ["What if my dog is nervous?", "¿Y si mi perro es nervioso?"], a: ["Say so when you book. Notes about temperament help the groomer plan the visit.", "Dígalo al reservar. Las notas sobre el carácter ayudan a planear la visita."] });
  return base;
}

export function faqFor(ctx) {
  if (ctx.kind === "booking") return bookingFaq(ctx.categoryKey);
  const base = FAQ_BY_KIND[ctx.kind] || FAQ_BY_KIND.request;
  return FAQ_EXTRA[ctx.categoryKey] ? [FAQ_EXTRA[ctx.categoryKey], ...base] : base;
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// "September 2026" from the injected render date, never the clock.
export function monthYear(date) {
  return [`${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`, `${MONTHS_ES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`];
}
