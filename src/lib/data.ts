import type {
  Customer,
  DemoState,
  Invoice,
  Line,
  Lot,
  Move,
  Order,
  PayMethod,
  Product,
  Route,
  RouteStatus,
  Vendor,
} from "./types";
import { routeSheet } from "./derive";

export const STATE_VERSION = 5;

export const TODAY = "2026-11-17";
export const YESTERDAY = "2026-11-16";
export const TOMORROW = "2026-11-18";

export const SCHEDULE: Record<number, { number: number; driver: string }[]> = {
  1: [{ number: 1, driver: "Ernesto" }, { number: 2, driver: "Luis" }, { number: 3, driver: "Manny" }],
  2: [{ number: 4, driver: "Junior" }, { number: 5, driver: "Ruben" }, { number: 6, driver: "Luis" }, { number: 7, driver: "Manny" }],
  3: [{ number: 8, driver: "Junior" }, { number: 9, driver: "Ruben" }, { number: 10, driver: "Ernesto" }, { number: 11, driver: "Luis" }],
  4: [{ number: 12, driver: "Manny" }, { number: 13, driver: "Junior" }, { number: 14, driver: "Ruben" }, { number: 15, driver: "Ernesto" }],
  5: [{ number: 16, driver: "Luis" }, { number: 17, driver: "Manny" }, { number: 18, driver: "Junior" }, { number: 19, driver: "Ruben" }],
};

export const COMPANY = {
  name: "Cal Egg X",
  mail: "P.O. Box 9242, Redlands, CA 92375",
  yard: "1331 Sapphire Ave, Mentone",
};

export const PRODUCTS: Product[] = [
  { id: "jumbo-carton", name: "Jumbo carton", price: 21, kind: "egg" },
  { id: "jumbo-loose", name: "Jumbo loose", price: 19, kind: "egg" },
  { id: "jl-brown", name: "JL brown", price: 22, kind: "egg" },
  { id: "xl-loose", name: "XL loose", price: 17, kind: "egg" },
  { id: "xl-carton", name: "XL carton", price: 19, kind: "egg" },
  { id: "xl-ow", name: "XL O/W", price: 17, kind: "egg" },
  { id: "xl-owb", name: "XL O/WB", price: 18, kind: "egg" },
  { id: "xl-brown", name: "XL brown", price: 20, kind: "egg" },
  { id: "large-loose", name: "Large loose", price: 14, kind: "egg" },
  { id: "large-carton", name: "Large carton", price: 16, kind: "egg" },
  { id: "large-brown", name: "Large brown", price: 18, kind: "egg" },
  { id: "large-bc", name: "Large BC", price: 16, kind: "egg" },
  { id: "medium-loose", name: "Medium loose", price: 12, kind: "egg" },
  { id: "medium-c", name: "Medium C", price: 14, kind: "egg" },
  { id: "m-5doz", name: "M 5 dozen", price: 6, kind: "egg" },
  { id: "small-loose", name: "Small loose", price: 10, kind: "egg" },
  { id: "xl-4x5", name: "XL 4x5", price: 9, kind: "egg" },
  { id: "cheese", name: "Cheese", price: 32, kind: "cheese" },
];

export const VENDORS: Vendor[] = [
  { id: "hilltop", name: "Hilltop Farms" },
  { id: "valley", name: "Valley Ranch" },
  { id: "sunrise", name: "Sunrise Poultry" },
];

export const PEOPLE = {
  colin: "Colin",
  alma: "Alma",
  alejandro: "Alejandro",
  inputter: "Inputter",
};

export const DRIVERS = ["Junior", "Ruben", "Luis", "Manny", "Ernesto"];

const FRIDAY_SHEET: Record<string, number> = {
  "jumbo-carton": 9,
  "jumbo-loose": 9,
  "jl-brown": 0,
  "xl-loose": 75,
  "xl-carton": 9,
  "xl-ow": 163,
  "xl-owb": 20,
  "xl-brown": 54,
  "large-loose": 45,
  "large-carton": 85,
  "large-brown": 0,
  "large-bc": 6,
  "medium-loose": 649,
  "medium-c": 16,
  "m-5doz": 36,
  "small-loose": 60,
  "xl-4x5": 0,
  cheese: 24,
};

const SPLITS: Record<string, { vendorId: string; boxes: number; cost: number; receivedAt: string }[]> = {
  "large-loose": [
    { vendorId: "hilltop", boxes: 20, cost: 11.4, receivedAt: "2026-11-10T09:15:00" },
    { vendorId: "valley", boxes: 15, cost: 12.2, receivedAt: "2026-11-12T10:05:00" },
    { vendorId: "sunrise", boxes: 10, cost: 12.95, receivedAt: "2026-11-16T10:40:00" },
  ],
  "medium-loose": [
    { vendorId: "valley", boxes: 249, cost: 9.3, receivedAt: "2026-11-11T08:50:00" },
    { vendorId: "hilltop", boxes: 400, cost: 9.85, receivedAt: "2026-11-14T07:30:00" },
  ],
  "xl-ow": [
    { vendorId: "sunrise", boxes: 63, cost: 13.6, receivedAt: "2026-11-09T11:00:00" },
    { vendorId: "hilltop", boxes: 100, cost: 14.1, receivedAt: "2026-11-13T09:20:00" },
  ],
};

function buildLots(): Lot[] {
  const lots: Lot[] = [];
  PRODUCTS.forEach((p, i) => {
    const boxes = FRIDAY_SHEET[p.id] ?? 0;
    if (boxes <= 0) return;
    const split = SPLITS[p.id];
    if (split) {
      split.forEach((s, j) => lots.push({ id: `lot-${p.id}-${j}`, productId: p.id, ...s }));
      return;
    }
    const vendor = VENDORS[i % VENDORS.length];
    lots.push({
      id: `lot-${p.id}-0`,
      productId: p.id,
      vendorId: vendor.id,
      boxes,
      cost: Math.round(p.price * 0.8 * 20) / 20,
      receivedAt: `2026-11-1${(i % 6) + 0}T08:${String(10 + i).padStart(2, "0")}:00`,
    });
  });
  return lots;
}

type Seed = {
  name: string;
  city: string;
  standing?: boolean;
  usual: PayMethod;
  order: [string, number][];
};

const L = (o: [string, number][]): Line[] => o.map(([productId, boxes]) => ({ productId, boxes }));

const ROUTE_SEEDS: Record<number, Seed[]> = {
  4: [
    { name: "DT Coffee Shop", city: "Redlands", usual: "cash", order: [["xl-loose", 6]] },
    { name: "Mariscos El Gordo", city: "San Bernardino", standing: true, usual: "charge", order: [["medium-loose", 12], ["large-loose", 4]] },
    { name: "Redlands Donut House", city: "Redlands", standing: true, usual: "cash", order: [["medium-loose", 10]] },
    { name: "La Michoacana Market", city: "Redlands", usual: "check", order: [["medium-loose", 14], ["xl-ow", 4], ["m-5doz", 2]] },
    { name: "Sunrise Cafe", city: "Mentone", usual: "charge", order: [["large-carton", 4], ["xl-loose", 2]] },
    { name: "Yucaipa Bakery", city: "Yucaipa", standing: true, usual: "charge", order: [["medium-loose", 8], ["small-loose", 4]] },
    { name: "Tacos El Patron", city: "Yucaipa", usual: "cash", order: [["medium-loose", 6]] },
    { name: "Mentone Market", city: "Mentone", usual: "check", order: [["large-loose", 3], ["xl-brown", 2], ["jumbo-carton", 1]] },
    { name: "The Breakfast Spot", city: "Highland", usual: "charge", order: [["xl-ow", 5], ["large-loose", 2]] },
    { name: "Pho Saigon", city: "Loma Linda", standing: true, usual: "cash", order: [["medium-loose", 6]] },
    { name: "Loma Linda Deli", city: "Loma Linda", usual: "charge", order: [["large-carton", 3], ["medium-c", 2]] },
    { name: "Panaderia La Reina", city: "Highland", usual: "check", order: [["medium-loose", 9], ["small-loose", 3]] },
    { name: "Highland Grill", city: "Highland", standing: true, usual: "charge", order: [["xl-ow", 4]] },
    { name: "Oak Glen Diner", city: "Oak Glen", usual: "charge", order: [["large-loose", 4], ["cheese", 2]] },
  ],
  5: [
    { name: "Chai Coffee", city: "Yucaipa", usual: "charge", order: [["large-loose", 2]] },
    { name: "Calimesa Country Store", city: "Calimesa", standing: true, usual: "cash", order: [["medium-loose", 8]] },
    { name: "El Tapatio", city: "Beaumont", usual: "check", order: [["medium-loose", 10], ["xl-ow", 3]] },
    { name: "Banning Family Diner", city: "Banning", usual: "charge", order: [["large-carton", 5]] },
    { name: "Cherry Valley Bakery", city: "Cherry Valley", standing: true, usual: "check", order: [["medium-loose", 6], ["small-loose", 2]] },
    { name: "Beaumont Burgers", city: "Beaumont", usual: "cash", order: [["xl-loose", 4]] },
    { name: "Pass Area Market", city: "Banning", usual: "charge", order: [["medium-loose", 12], ["large-loose", 3]] },
    { name: "Taqueria Jalisco", city: "Beaumont", usual: "cash", order: [["medium-loose", 5]] },
    { name: "Sun Lakes Cafe", city: "Banning", usual: "charge", order: [["xl-ow", 3], ["large-carton", 2]] },
    { name: "Morongo Mart", city: "Cabazon", standing: true, usual: "check", order: [["medium-loose", 7]] },
    { name: "Wildwood Grill", city: "Yucaipa", usual: "charge", order: [["xl-brown", 3]] },
    { name: "Oak Valley Deli", city: "Calimesa", usual: "cash", order: [["large-loose", 2], ["medium-c", 2]] },
  ],
  6: [
    { name: "Orange Street Cafe", city: "Redlands", usual: "cash", order: [["xl-loose", 4]] },
    { name: "Mi Ranchito", city: "Colton", standing: true, usual: "check", order: [["medium-loose", 12]] },
    { name: "Colton Donuts", city: "Colton", usual: "cash", order: [["medium-loose", 8]] },
    { name: "Rialto Carniceria", city: "Rialto", usual: "charge", order: [["medium-loose", 10], ["xl-ow", 4]] },
    { name: "Bloomington Bakery", city: "Bloomington", standing: true, usual: "charge", order: [["medium-loose", 6], ["small-loose", 3]] },
    { name: "Fontana Grill", city: "Fontana", usual: "cash", order: [["large-carton", 3]] },
    { name: "Los Compadres", city: "Fontana", usual: "check", order: [["medium-loose", 9]] },
    { name: "Grand Terrace Cafe", city: "Grand Terrace", usual: "charge", order: [["xl-ow", 4], ["large-loose", 2]] },
    { name: "Riverside Pho", city: "Riverside", standing: true, usual: "cash", order: [["medium-loose", 5]] },
    { name: "Mt. Vernon Market", city: "San Bernardino", usual: "charge", order: [["medium-loose", 7], ["m-5doz", 3]] },
    { name: "Cal State Deli", city: "San Bernardino", usual: "check", order: [["large-carton", 2], ["xl-loose", 2]] },
  ],
  7: [
    { name: "Highland Ave Diner", city: "Highland", usual: "cash", order: [["xl-ow", 5]] },
    { name: "Arrowhead Market", city: "San Bernardino", standing: true, usual: "charge", order: [["medium-loose", 11]] },
    { name: "Del Rosa Bakery", city: "San Bernardino", usual: "check", order: [["medium-loose", 7], ["small-loose", 2]] },
    { name: "Running Springs Cafe", city: "Running Springs", usual: "charge", order: [["large-carton", 3], ["xl-loose", 2]] },
    { name: "Lake Arrowhead Grill", city: "Lake Arrowhead", usual: "charge", order: [["xl-brown", 4]] },
    { name: "Crestline Coffee", city: "Crestline", standing: true, usual: "cash", order: [["xl-loose", 3]] },
    { name: "Taqueria Los Primos", city: "Highland", usual: "cash", order: [["medium-loose", 6]] },
    { name: "Baseline Market", city: "Highland", usual: "check", order: [["medium-loose", 9], ["xl-ow", 2]] },
    { name: "East Highland Deli", city: "Highland", usual: "charge", order: [["large-loose", 3]] },
    { name: "Patton Cafe", city: "Patton", standing: true, usual: "check", order: [["medium-loose", 5]] },
  ],
  1: [
    { name: "Citrus Plaza Cafe", city: "Redlands", usual: "cash", order: [["xl-loose", 5]] },
    { name: "Brookside Market", city: "Redlands", standing: true, usual: "charge", order: [["medium-loose", 10]] },
    { name: "University Donuts", city: "Redlands", usual: "cash", order: [["medium-loose", 8]] },
    { name: "Mission Inn Deli", city: "Riverside", usual: "check", order: [["large-carton", 4], ["xl-ow", 3]] },
    { name: "Loma Linda Market", city: "Loma Linda", usual: "charge", order: [["medium-loose", 12]] },
    { name: "Barton Road Cafe", city: "Loma Linda", standing: true, usual: "check", order: [["medium-loose", 6]] },
    { name: "Taqueria La Bamba", city: "Colton", usual: "cash", order: [["medium-loose", 5]] },
    { name: "Hospitality Lane Grill", city: "San Bernardino", usual: "charge", order: [["xl-ow", 4], ["large-loose", 2]] },
    { name: "Tri-City Bakery", city: "San Bernardino", usual: "charge", order: [["medium-loose", 7], ["small-loose", 2]] },
    { name: "Redlands Pho", city: "Redlands", standing: true, usual: "cash", order: [["medium-loose", 4]] },
    { name: "Cajon Street Diner", city: "Redlands", usual: "check", order: [["xl-loose", 3]] },
    { name: "Ford Park Market", city: "Redlands", usual: "charge", order: [["large-carton", 3], ["medium-c", 2]] },
  ],
  2: [
    { name: "Yucaipa Blvd Cafe", city: "Yucaipa", usual: "cash", order: [["xl-loose", 4]] },
    { name: "Dunlap Market", city: "Yucaipa", standing: true, usual: "charge", order: [["medium-loose", 9]] },
    { name: "Calimesa Donuts", city: "Calimesa", usual: "cash", order: [["medium-loose", 6]] },
    { name: "Oak Glen Apple Barn", city: "Oak Glen", usual: "check", order: [["large-carton", 3]] },
    { name: "Mentone Grill", city: "Mentone", usual: "charge", order: [["xl-ow", 4]] },
    { name: "Crafton Hills Cafe", city: "Yucaipa", standing: true, usual: "cash", order: [["medium-loose", 5]] },
    { name: "Panaderia San Jose", city: "Yucaipa", usual: "check", order: [["medium-loose", 8], ["small-loose", 2]] },
    { name: "Wildwood Market", city: "Yucaipa", usual: "charge", order: [["large-loose", 3]] },
    { name: "Bryn Mawr Deli", city: "Loma Linda", usual: "cash", order: [["large-carton", 2], ["xl-loose", 2]] },
    { name: "Sand Canyon Cafe", city: "Yucaipa", standing: true, usual: "charge", order: [["medium-loose", 6]] },
    { name: "Avenue E Market", city: "Yucaipa", usual: "check", order: [["xl-brown", 2], ["medium-loose", 4]] },
  ],
  3: [
    { name: "Del Rosa Diner", city: "San Bernardino", usual: "cash", order: [["xl-ow", 4]] },
    { name: "Waterman Market", city: "San Bernardino", standing: true, usual: "charge", order: [["medium-loose", 10]] },
    { name: "Highland Donuts", city: "Highland", usual: "cash", order: [["medium-loose", 6]] },
    { name: "Base Line Bakery", city: "Highland", standing: true, usual: "check", order: [["medium-loose", 5], ["small-loose", 2]] },
    { name: "Palm Ave Cafe", city: "Highland", usual: "charge", order: [["large-carton", 3]] },
    { name: "Cottonwood Grill", city: "Highland", usual: "charge", order: [["xl-loose", 3], ["large-loose", 2]] },
    { name: "Taqueria El Sol", city: "San Bernardino", usual: "cash", order: [["medium-loose", 5]] },
    { name: "Little Mountain Deli", city: "San Bernardino", usual: "check", order: [["large-carton", 2]] },
    { name: "Sterling Market", city: "Highland", standing: true, usual: "charge", order: [["medium-loose", 7], ["xl-ow", 2]] },
    { name: "Boulder Cafe", city: "Highland", usual: "cash", order: [["xl-loose", 3]] },
  ],
};

const TOWNS = ["Redlands", "Yucaipa", "Highland", "San Bernardino", "Loma Linda", "Colton", "Rialto", "Fontana", "Beaumont", "Banning", "Riverside", "Mentone", "Calimesa", "Grand Terrace"];
const PLACES = ["Cafe", "Market", "Donuts", "Taqueria", "Bakery", "Deli", "Grill", "Pho", "Diner", "Carniceria", "Panaderia", "Burgers"];
const NAMES = ["Sunset", "El Rancho", "Golden", "Corner", "Main Street", "La Esquina", "Hillside", "Mission", "Orchard", "Canyon", "Lucky", "Plaza", "Mesa", "Pine", "Del Sol", "Arroyo", "Cedar", "Vista", "Rosa", "Twin Oaks"];
const ORDERS: [string, number][][] = [
  [["medium-loose", 10]],
  [["xl-loose", 4]],
  [["medium-loose", 8], ["small-loose", 2]],
  [["large-carton", 3], ["xl-ow", 2]],
  [["medium-loose", 6]],
  [["xl-ow", 4], ["large-loose", 2]],
  [["large-loose", 3]],
  [["medium-loose", 12], ["m-5doz", 2]],
  [["xl-brown", 2], ["medium-loose", 4]],
];
const USUAL: PayMethod[] = ["cash", "charge", "check", "cash", "charge", "check", "cash", "charge"];

for (let n = 8; n <= 19; n++) {
  const count = 9 + (n % 4);
  ROUTE_SEEDS[n] = Array.from({ length: count }, (_, i) => {
    const k = n * 7 + i * 3;
    const town = TOWNS[(n + i) % TOWNS.length];
    return {
      name: `${NAMES[k % NAMES.length]} ${PLACES[(n + i * 5) % PLACES.length]}`,
      city: town,
      standing: (n + i) % 4 === 1,
      usual: USUAL[(n + i) % USUAL.length],
      order: ORDERS[(n * 2 + i) % ORDERS.length],
    };
  });
}

const OPENING: Record<string, { amount: number; since: string; tally?: boolean }> = {
  "Mariscos El Gordo": { amount: 412.5, since: "2026-10-20" },
  "Highland Grill": { amount: 640, since: "2026-09-28", tally: true },
  "Chai Coffee": { amount: 56, since: "2026-11-06" },
  "Banning Family Diner": { amount: 238, since: "2026-10-14" },
  "Hospitality Lane Grill": { amount: 372, since: "2026-10-05" },
  "Loma Linda Market": { amount: 144, since: "2026-11-02" },
  "Rialto Carniceria": { amount: 1180, since: "2026-08-30" },
  "Waterman Market": { amount: 260, since: "2026-10-26" },
  "Oak Glen Diner": { amount: 96, since: "2026-11-09" },
};

const ROUTE_META: { number: number; date: string; driver: string; status: RouteStatus }[] = [
  { number: 1, date: YESTERDAY, driver: "Ernesto", status: "audited" },
  { number: 2, date: YESTERDAY, driver: "Luis", status: "checkedIn" },
  { number: 3, date: YESTERDAY, driver: "Manny", status: "back" },
  { number: 4, date: TODAY, driver: "Junior", status: "ready" },
  { number: 5, date: TODAY, driver: "Ruben", status: "ready" },
  { number: 6, date: TODAY, driver: "Luis", status: "out" },
  { number: 7, date: TODAY, driver: "Manny", status: "loaded" },
  ...SCHEDULE[3].map((r) => ({ ...r, date: TOMORROW, status: "calling" as RouteStatus })),
  ...["2026-11-19", "2026-11-20", "2026-11-23"].flatMap((date) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return SCHEDULE[weekday].map((r) => ({ ...r, date, status: "calling" as RouteStatus }));
  }),
];

export function routeId(number: number, date?: string) {
  return number <= 7 && (!date || date <= TODAY) ? `r${number}` : `r${number}-${date}`;
}

const priceOf = (productId: string) => PRODUCTS.find((p) => p.id === productId)!.price;

export function buildSeed(): DemoState {
  const customers: Customer[] = [];
  const routes: Route[] = [];
  const orders: Order[] = [];
  const invoices: Invoice[] = [];
  let nextInvoice = 255780;
  let checkNo = 4410;

  for (const [no, seeds] of Object.entries(ROUTE_SEEDS)) {
    seeds.forEach((seed, index) => {
      customers.push({
        id: `c${no}-${index + 1}`,
        name: seed.name,
        city: seed.city,
        routeNo: Number(no),
        stop: index + 1,
        standing: !!seed.standing,
        usual: seed.usual,
        terms: seed.usual === "charge" ? "Net 30" : "COD",
        usualOrder: L(seed.order),
        openingBalance: OPENING[seed.name]?.amount ?? 0,
        openingSince: OPENING[seed.name]?.since,
        openTally: OPENING[seed.name]?.tally,
      });
    });
  }

  for (const meta of ROUTE_META) {
    const rid = routeId(meta.number, meta.date);
    routes.push({
      id: rid,
      number: meta.number,
      date: meta.date,
      driver: meta.driver,
      status: meta.status,
      roa: { count: 0, amount: 0 },
    });

    ROUTE_SEEDS[meta.number].forEach((seed, index) => {
      const cid = `c${meta.number}-${index + 1}`;
      const usualOrder = L(seed.order);

      if (meta.status === "calling") {
        orders.push({
          customerId: cid,
          routeId: rid,
          lines: seed.standing ? usualOrder.map((l) => ({ ...l })) : [],
          called: false,
        });
        return;
      }

      const lines = usualOrder.map((l) => ({ ...l }));
      const swap = meta.number === 3 && index === 2 ? { productId: "medium-loose", boxes: 1 } : undefined;
      orders.push({ customerId: cid, routeId: rid, lines, swap, called: true });
      const prices: Record<string, number> = {};
      lines.forEach((l) => (prices[l.productId] = priceOf(l.productId)));
      invoices.push({
        number: nextInvoice++,
        routeId: rid,
        customerId: cid,
        date: meta.date,
        lines,
        prices,
        swap,
        status: "open",
        enteredCount: 0,
      });
    });
  }

  const total = (inv: Invoice) => inv.lines.reduce((s, l) => s + l.boxes * inv.prices[l.productId], 0);

  const deliver = (inv: Invoice, at: string) => {
    const c = customers.find((x) => x.id === inv.customerId)!;
    inv.status = "delivered";
    inv.result = {
      delivered: inv.lines.map((l) => ({ ...l })),
      method: c.usual,
      amount: total(inv),
      checkNo: c.usual === "check" ? String(checkNo++) : undefined,
      signedBy: c.name.split(" ")[0],
      at,
    };
  };

  for (const route of routes) {
    const routeInvoices = invoices.filter((i) => i.routeId === route.id);
    if (["back", "checkedIn", "audited", "entered"].includes(route.status)) {
      routeInvoices.forEach((inv, i) => {
        const minute = String(10 + i * 3).padStart(2, "0");
        deliver(inv, `${route.date}T0${7 + Math.floor(i / 4)}:${minute}:00`);
      });
      route.driverSigned = route.driver;
      route.loadedAt = `${route.date}T05:30:00`;
      route.backAt = `${route.date}T14:20:00`;
      if (route.status !== "back") route.managerSigned = PEOPLE.alejandro;
    }
    if (route.status === "out") {
      route.loadedAt = `${route.date}T05:20:00`;
      routeInvoices.slice(0, 6).forEach((inv, i) => {
        deliver(inv, `${route.date}T0${7 + Math.floor(i / 3)}:${String(5 + i * 9).padStart(2, "0")}:00`);
      });
    }
    if (route.status === "loaded") route.loadedAt = `${route.date}T05:40:00`;
  }

  const r3 = invoices.filter((i) => i.routeId === "r3");
  const voided = r3[3];
  voided.status = "void";
  voided.result = undefined;
  const shortStop = r3[8];
  if (shortStop.result) {
    shortStop.result.delivered = shortStop.result.delivered.map((l) =>
      l.productId === "medium-loose" ? { ...l, boxes: l.boxes - 1 } : l
    );
    shortStop.result.amount = shortStop.result.delivered.reduce(
      (s, l) => s + l.boxes * shortStop.prices[l.productId],
      0
    );
  }

  const r1 = invoices.filter((i) => i.routeId === "r1");
  r1.forEach((inv) => (inv.enteredCount = 1));
  r1[6].enteredCount = 0;
  r1[9].enteredCount = 2;
  routes.find((r) => r.id === "r1")!.roa = { count: 1, amount: 186.5 };
  const payments: DemoState["payments"] = [
    { id: "p-1", customerId: customers.find((c) => c.name === "Hospitality Lane Grill")!.id, amount: 186.5, method: "check", checkNo: "2290", at: "2026-11-16T11:05:00", by: "Ernesto", routeId: "r1" },
    { id: "p-2", customerId: customers.find((c) => c.name === "Highland Grill")!.id, amount: 300, method: "check", checkNo: "1187", at: "2026-11-10T16:20:00", by: PEOPLE.colin },
  ];

  const moves: Move[] = [
    { id: "m-1", at: "2026-11-13T12:05:00", kind: "count", productId: "medium-loose", vendorId: "valley", boxes: -3, who: PEOPLE.colin, note: "Friday count approved. 3 boxes short." },
    { id: "m-2", at: "2026-11-14T07:30:00", kind: "receive", productId: "medium-loose", vendorId: "hilltop", boxes: 400, who: PEOPLE.alejandro, note: "$9.85 a box" },
    { id: "m-3", at: "2026-11-14T09:10:00", kind: "pull", productId: "xl-ow", vendorId: "sunrise", boxes: -10, who: PEOPLE.colin, note: "Saturday pickup. No invoice." },
    { id: "m-4", at: "2026-11-16T05:30:00", kind: "load", productId: "medium-loose", vendorId: "valley", boxes: -91, who: PEOPLE.alejandro, routeId: "r1", note: "Routes 1, 2, 3" },
    { id: "m-5", at: "2026-11-16T05:30:00", kind: "load", productId: "xl-ow", vendorId: "sunrise", boxes: -17, who: PEOPLE.alejandro, note: "Routes 1, 2, 3" },
    { id: "m-6", at: "2026-11-16T10:40:00", kind: "receive", productId: "large-loose", vendorId: "sunrise", boxes: 10, who: PEOPLE.alejandro, note: "$12.95 a box" },
    { id: "m-7", at: `${TODAY}T05:20:00`, kind: "load", productId: "medium-loose", vendorId: "valley", boxes: -57, who: PEOPLE.alejandro, routeId: "r6", note: "Route 6" },
    { id: "m-8", at: `${TODAY}T05:40:00`, kind: "load", productId: "medium-loose", vendorId: "valley", boxes: -38, who: PEOPLE.alejandro, routeId: "r7", note: "Route 7" },
  ];

  const state: DemoState = {
    version: STATE_VERSION,
    today: TODAY,
    products: PRODUCTS,
    vendors: VENDORS,
    lots: buildLots(),
    customers,
    routes,
    orders,
    invoices,
    moves,
    counts: [],
    audits: [],
    payments,
    nextInvoice,
    driverRoute: "r4",
    almaRoute: routeId(8, TOMORROW),
    almaDate: TOMORROW,
  };

  const r1Sheet = routeSheet(state, "r1");
  state.audits.push({
    routeId: "r1",
    cash: r1Sheet.cash.amount,
    checks: r1Sheet.checks.count + r1Sheet.roa.count,
    checkAmount: r1Sheet.checks.amount + r1Sheet.roa.amount,
    note: "",
    at: "2026-11-16T19:30:00",
  });

  return state;
}
