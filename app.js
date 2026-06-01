const FEED_URL = "./cars.json";
const WHATSAPP_NUMBER = "237687003958";
const CONTACT_EMAIL = "Karmiles87@gmail.com";
const CONTACT_PHONE = "+237687003958";
const CONTACT_PHONE_DISPLAY = "+237 687 00 39 58";

let vehicles = [];
let activeVehicle = null;

const fallbackVehicles = [
  {
    id: "AUTO-001",
    marke: "BMW",
    modell: "220i Active Tourer Steptronic Sport Line",
    baujahr: 2015,
    kraftstoff: "Benzin",
    kilometerstand: 142900,
    getriebe: "Automatik",
    preis: 8900,
    bildUrl: "assets/cars/auto-001/01.jpg",
    images: ["assets/cars/auto-001/01.jpg"],
    status: "Aktiv"
  }
];

const faqs = [
  ["Kontakt", "Wie bekomme ich weitere Informationen zu einem Fahrzeug?", "Oeffnen Sie die Fahrzeugdetails und kontaktieren Sie uns direkt per WhatsApp, Telefon oder E-Mail. Bitte nennen Sie immer die Fahrzeug-ID."],
  ["Fahrzeuge", "Sind die Fahrzeuge direkt verkaufbar?", "Ja. Die Fahrzeuge werden als direkte Verkaufsangebote mit festen Preisen, Fotos und Kontaktdaten angezeigt."],
  ["Preise", "Sind die Preise verhandelbar?", "Nein. Die angegebenen Preise sind Festpreise und nicht verhandelbar."],
  ["Kaufprozess", "Wie laeuft der Kauf ab?", "Nach Ihrer Anfrage klaeren wir Verfuegbarkeit, Reservierung, Zahlung, Unterlagen und Uebergabe beziehungsweise Transport."],
  ["Abholung", "Wie vereinbare ich die Fahrzeugabholung?", "Vor jeder Fahrzeuguebernahme vereinbaren Sie bitte per E-Mail einen Termin mit dem Ansprechpartner des Standorts. Nennen Sie Fahrzeug-ID, Modell und Zahlungswunsch."],
  ["Logistik", "Kann AUTO.DE den Transport organisieren?", "Ja. Auf Wunsch kann die Abholung oder Lieferung abgestimmt werden."]
];

const formatNumber = value => new Intl.NumberFormat("de-DE").format(value || 0);
const formatPrice = value => value ? `${formatNumber(value)} EUR` : "Preis auf Anfrage";
const formatYear = value => value ? String(value) : "Auf Anfrage";
const formatMileage = value => value ? `${formatNumber(value)} km` : "Auf Anfrage";

function normalizeVehicle(raw, index) {
  const image = raw.bildUrl || raw.image || raw.imageUrl || raw.images?.[0] || "";
  const images = Array.isArray(raw.images) && raw.images.length ? raw.images : (image ? [image] : []);

  return {
    id: String(raw.id || raw.stockNumber || raw.vin || `feed-${index + 1}`),
    brand: raw.marke || raw.brand || raw.make || raw.hersteller || "Unbekannte Marke",
    model: raw.modell || raw.model || "Fahrzeug",
    year: Number(raw.baujahr || raw.year || raw.firstRegistrationYear || 0),
    energy: raw.kraftstoff || raw.energy || raw.fuel || "Nicht angegeben",
    mileage: Number(raw.kilometerstand || raw.mileage || raw.kilometer || raw.km || 0),
    gearbox: raw.getriebe || raw.gearbox || raw.transmission || "Nicht angegeben",
    price: Number(raw.preis || raw.price || raw.grossPrice || 0),
    image,
    images,
    status: raw.status || raw.availability || "Aktiv",
    raw
  };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(header => header.trim());

  return lines.map(line => {
    const values = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    return headers.reduce((item, header, index) => {
      item[header] = (values[index] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      return item;
    }, {});
  });
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.vehicles)) return payload.vehicles;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.records)) return payload.records.map(record => record.fields || record);
  return Object.values(payload).find(Array.isArray) || [];
}

function parseFeedText(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return extractItems(JSON.parse(trimmed));
  return parseCsv(trimmed);
}

async function loadVehicleFeed() {
  const status = document.querySelector("#feed-status");

  try {
    const response = await fetch(FEED_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    vehicles = parseFeedText(await response.text()).map(normalizeVehicle);
    status.textContent = `${vehicles.length} Fahrzeuge im Verkauf.`;
  } catch (error) {
    vehicles = fallbackVehicles.map(normalizeVehicle);
    status.textContent = "Der Fahrzeugbestand konnte nicht geladen werden.";
  }
}

function carMarkup() {
  return `<div class="car-shape silver"><span class="wheel rear"></span><span class="wheel front"></span></div>`;
}

function vehicleImage(vehicle) {
  if (vehicle.image) {
    return `<img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" loading="lazy" />`;
  }
  return carMarkup();
}

function vehicleLabel(vehicle) {
  return `${vehicle.brand} ${vehicle.model}`;
}

function whatsappUrl(vehicle) {
  const message = vehicle
    ? `Bonjour, je suis interesse par le vehicule ${vehicleLabel(vehicle)} (${vehicle.id}) au prix ${formatPrice(vehicle.price)}. Pouvez-vous me donner plus d'informations ?`
    : "Bonjour, je souhaite avoir plus d'informations sur vos vehicules disponibles.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function phoneUrl() {
  return `tel:${CONTACT_PHONE}`;
}

function emailUrl(vehicle) {
  const subject = vehicle ? `Demande vehicule ${vehicle.id} - ${vehicleLabel(vehicle)}` : "Demande d'information AUTO.DE";
  const body = vehicle
    ? `Bonjour,\n\nJe souhaite avoir plus d'informations sur le vehicule ${vehicleLabel(vehicle)}.\nID: ${vehicle.id}\nAnnee: ${formatYear(vehicle.year)}\nKilometrage: ${formatMileage(vehicle.mileage)}\nCarburant: ${vehicle.energy}\nBoite: ${vehicle.gearbox}\nPrix: ${formatPrice(vehicle.price)}\n\nMerci.`
    : "Bonjour,\n\nJe souhaite avoir plus d'informations sur vos vehicules disponibles.\n\nMerci.";
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function cardSpecs(vehicle) {
  return [
    ["Fahrzeug-ID", vehicle.id],
    ["Baujahr", formatYear(vehicle.year)],
    ["Kilometer", formatMileage(vehicle.mileage)],
    ["Kraftstoff", vehicle.energy],
    ["Getriebe", vehicle.gearbox],
    ["Status", vehicle.status]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function renderHomeOffers() {
  const target = document.querySelector("#home-offers");
  target.innerHTML = vehicles.slice(0, 3).map(vehicle => `
    <article class="compact-card">
      <button class="mini-car media-button" type="button" data-details="${vehicle.id}">${vehicleImage(vehicle)}</button>
      <div>
        <h3>${vehicleLabel(vehicle)}</h3>
        <p>${formatYear(vehicle.year)} - ${vehicle.energy} - ${formatMileage(vehicle.mileage)}</p>
        <strong>${formatPrice(vehicle.price)}</strong>
      </div>
    </article>
  `).join("");
}

function selectedValues(type) {
  return [...document.querySelectorAll(`[data-filter="${type}"]:checked`)].map(input => input.value);
}

function renderCatalog() {
  const grid = document.querySelector("#catalog-grid");
  const query = document.querySelector("#search").value.trim().toLowerCase();
  const brands = selectedValues("brand");
  const energies = selectedValues("energy");
  const maxPrice = Number(document.querySelector("#price-range").value);
  const maxMileage = Number(document.querySelector("#mileage-range").value);

  const filtered = vehicles.filter(vehicle => {
    const text = `${vehicle.brand} ${vehicle.model} ${vehicle.energy} ${vehicle.gearbox} ${vehicle.status}`.toLowerCase();
    return (!query || text.includes(query))
      && (!brands.length || brands.includes(vehicle.brand))
      && (!energies.length || energies.includes(vehicle.energy))
      && (!vehicle.price || vehicle.price <= maxPrice)
      && (!vehicle.mileage || vehicle.mileage <= maxMileage);
  });

  document.querySelector("#result-count").textContent = `${filtered.length} Fahrzeuge`;
  grid.innerHTML = filtered.length ? filtered.map(vehicle => `
    <article class="vehicle-card">
      <button class="vehicle-media media-button" type="button" data-details="${vehicle.id}" aria-label="Details ${vehicleLabel(vehicle)}">
        <span class="status-badge">${vehicle.status}</span>
        ${vehicleImage(vehicle)}
      </button>
      <div class="vehicle-body">
        <h2>${vehicleLabel(vehicle)}</h2>
        <strong class="vehicle-price">${formatPrice(vehicle.price)}</strong>
        <dl class="vehicle-specs">${cardSpecs(vehicle)}</dl>
        <div class="card-actions">
          <button class="secondary-btn details-action" type="button" data-details="${vehicle.id}">Details ansehen</button>
          <a class="whatsapp-btn" href="${whatsappUrl(vehicle)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="phone-btn" href="${phoneUrl()}">Anrufen</a>
          <a class="secondary-btn email-btn" href="${emailUrl(vehicle)}" target="_blank" rel="noopener">E-Mail</a>
        </div>
      </div>
    </article>
  `).join("") : `<p class="empty-state">Keine Fahrzeuge fuer diese Filter gefunden.</p>`;
}

function renderFaq() {
  const list = document.querySelector("#faq-list");
  list.innerHTML = faqs.map(([category, question, answer], index) => `
    <article class="faq-item ${index === 0 ? "open" : ""}">
      <button type="button" aria-expanded="${index === 0}">
        <span>${category}</span>
        <span>${index === 0 ? "^" : "v"}</span>
      </button>
      <p><strong>${question}</strong><br>${answer}</p>
    </article>
  `).join("");
}

function setRoute(route) {
  const validRoute = document.querySelector(`[data-page="${route}"]`) ? route : "home";
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.dataset.page === validRoute));
  document.querySelectorAll(".nav-links a").forEach(link => link.classList.toggle("active", link.dataset.route === validRoute));
  document.querySelector(".nav-links").classList.remove("open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
}

function detailRows(vehicle) {
  return [
    ["Fahrzeug-ID", vehicle.id],
    ["Marke", vehicle.brand],
    ["Modell", vehicle.model],
    ["Baujahr", formatYear(vehicle.year)],
    ["Kraftstoff", vehicle.energy],
    ["Kilometerstand", formatMileage(vehicle.mileage)],
    ["Getriebe", vehicle.gearbox],
    ["Preis", formatPrice(vehicle.price)],
    ["Status", vehicle.status],
    ["Telefon", CONTACT_PHONE_DISPLAY],
    ["E-Mail", CONTACT_EMAIL]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function openVehicleDetails(vehicleId, imageIndex = 0) {
  const vehicle = vehicles.find(item => item.id === vehicleId);
  if (!vehicle) return;

  activeVehicle = vehicle;
  const modal = document.querySelector("#vehicle-modal");
  const images = vehicle.images.length ? vehicle.images : [vehicle.image].filter(Boolean);
  const currentImage = images[imageIndex] || images[0];

  document.querySelector("#modal-title").textContent = vehicleLabel(vehicle);
  document.querySelector("#modal-subtitle").textContent = `${formatYear(vehicle.year)} - ${vehicle.energy} - ${vehicle.gearbox} - ${formatMileage(vehicle.mileage)}`;
  document.querySelector("#modal-price").textContent = formatPrice(vehicle.price);
  document.querySelector("#modal-main-image").src = currentImage;
  document.querySelector("#modal-main-image").alt = vehicleLabel(vehicle);
  document.querySelector("#modal-specs").innerHTML = detailRows(vehicle);
  document.querySelector("#modal-whatsapp").href = whatsappUrl(vehicle);
  document.querySelector("#modal-phone").href = phoneUrl();
  document.querySelector("#modal-email").href = emailUrl(vehicle);
  document.querySelector("#modal-thumbs").innerHTML = images.map((image, index) => `
    <button class="${image === currentImage ? "active" : ""}" type="button" data-gallery-index="${index}">
      <img src="${image}" alt="${vehicleLabel(vehicle)} photo ${index + 1}" loading="lazy" />
    </button>
  `).join("");

  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeVehicleDetails() {
  document.querySelector("#vehicle-modal").hidden = true;
  document.body.classList.remove("modal-open");
  activeVehicle = null;
}

function setupContactLinks() {
  document.querySelector("#general-whatsapp").href = whatsappUrl();
  document.querySelector("#general-phone").href = phoneUrl();
  document.querySelector("#general-email").href = emailUrl();
}

function bindEvents() {
  window.addEventListener("hashchange", () => setRoute(location.hash.replace("#", "") || "home"));
  document.querySelector(".menu-toggle").addEventListener("click", event => {
    const menu = document.querySelector(".nav-links");
    const open = !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("#search, #price-range, #mileage-range, [data-filter]").forEach(input => {
    input.addEventListener("input", () => {
      document.querySelector("#price-label").textContent = `${formatNumber(document.querySelector("#price-range").value)} EUR`;
      document.querySelector("#mileage-label").textContent = `${formatNumber(document.querySelector("#mileage-range").value)} km`;
      renderCatalog();
    });
    input.addEventListener("change", renderCatalog);
  });

  document.addEventListener("click", event => {
    const details = event.target.closest("[data-details]");
    if (details) {
      openVehicleDetails(details.dataset.details);
      return;
    }

    const thumb = event.target.closest("[data-gallery-index]");
    if (thumb && activeVehicle) {
      openVehicleDetails(activeVehicle.id, Number(thumb.dataset.galleryIndex));
      return;
    }

    if (event.target.closest("[data-modal-close]")) {
      closeVehicleDetails();
      return;
    }

    const faqButton = event.target.closest(".faq-item button");
    if (faqButton) {
      const item = faqButton.closest(".faq-item");
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      faqButton.setAttribute("aria-expanded", String(open));
      faqButton.lastElementChild.textContent = open ? "^" : "v";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !document.querySelector("#vehicle-modal").hidden) {
      closeVehicleDetails();
    }
  });
}

async function init() {
  renderFaq();
  setupContactLinks();
  bindEvents();
  await loadVehicleFeed();
  renderHomeOffers();
  renderCatalog();
  setRoute(location.hash.replace("#", "") || "home");
}

init();
