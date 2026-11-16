export type ProductId = string;
export type VendorId = string;
export type CustomerId = string;
export type RouteId = string;

export type Product = {
  id: ProductId;
  name: string;
  price: number;
  kind: "egg" | "cheese";
};

export type Vendor = { id: VendorId; name: string };

export type Lot = {
  id: string;
  productId: ProductId;
  vendorId: VendorId;
  boxes: number;
  cost: number;
  receivedAt: string;
};

export type PayMethod = "cash" | "check" | "charge";

export type Customer = {
  id: CustomerId;
  name: string;
  city: string;
  routeNo: number;
  stop: number;
  standing: boolean;
  usual: PayMethod;
  terms: "COD" | "Net 30";
  usualOrder: Line[];
  openingBalance: number;
  openingSince?: string;
  openTally?: boolean;
  prices?: Record<ProductId, number>;
  phone?: string;
};

export type Payment = {
  id: string;
  customerId: CustomerId;
  amount: number;
  method: "cash" | "check";
  checkNo?: string;
  at: string;
  by: string;
  routeId?: RouteId;
};

export type Line = { productId: ProductId; boxes: number };

export type RouteStatus =
  | "calling"
  | "ready"
  | "loaded"
  | "out"
  | "back"
  | "checkedIn"
  | "audited"
  | "entered";

export type Route = {
  id: RouteId;
  number: number;
  date: string;
  driver: string;
  status: RouteStatus;
  roa: { count: number; amount: number };
  driverSigned?: string;
  managerSigned?: string;
  driverSignature?: string;
  managerSignature?: string;
  loadedAt?: string;
  backAt?: string;
};

export type Order = {
  customerId: CustomerId;
  routeId: RouteId;
  lines: Line[];
  swap?: Line;
  called: boolean;
  extra?: boolean;
};

export type StopResult = {
  delivered: Line[];
  method: PayMethod;
  amount: number;
  checkNo?: string;
  signature?: string;
  signedBy?: string;
  at: string;
};

export type Invoice = {
  number: number;
  routeId: RouteId;
  customerId: CustomerId;
  date: string;
  lines: Line[];
  prices: Record<ProductId, number>;
  swap?: Line;
  status: "open" | "delivered" | "void";
  result?: StopResult;
  enteredCount: number;
};

export type MoveKind = "receive" | "load" | "pull" | "return" | "expired" | "count";

export type Move = {
  id: string;
  at: string;
  kind: MoveKind;
  productId: ProductId;
  vendorId?: VendorId;
  boxes: number;
  cost?: number;
  who: string;
  note?: string;
  routeId?: RouteId;
};

export type Count = {
  id: string;
  at: string;
  by: string;
  typed: Record<ProductId, number>;
  expected: Record<ProductId, number>;
  status: "submitted" | "approved";
  approvedAt?: string;
};

export type Audit = {
  routeId: RouteId;
  cash: number;
  checks: number;
  checkAmount: number;
  note: string;
  at: string;
};

export type DemoState = {
  version: number;
  today: string;
  products: Product[];
  vendors: Vendor[];
  lots: Lot[];
  customers: Customer[];
  routes: Route[];
  orders: Order[];
  invoices: Invoice[];
  moves: Move[];
  counts: Count[];
  audits: Audit[];
  payments: Payment[];
  nextInvoice: number;
  driverRoute: RouteId;
  almaRoute: RouteId;
};
