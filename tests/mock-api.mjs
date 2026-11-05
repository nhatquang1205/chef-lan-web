// A tiny stand-in for the backend, used by the Playwright run: deterministic data, no database.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 5099);
const ORIGIN = `http://127.0.0.1:${PORT}`;

const users = {
  "owner@test.dev": { token: "tok-owner", actor: "Customer", id: 1, name: "Owner Test" },
  "visitor@test.dev": { token: "tok-visitor", actor: "Customer", id: 2, name: "Visitor Test" },
  "admin@test.dev": { token: "tok-admin", actor: "Staff", id: 9, name: "Admin Test" },
};
for (let n = 1; n <= 8; n++) {
  // One buyer per checkout test: a paid order makes its buyer an owner, and tests run in parallel.
  users[`buyer${n}@test.dev`] = { token: `tok-buyer${n}`, actor: "Customer", id: 30 + n, name: `Buyer ${n}` };
}
const PASSWORD = "Passw0rd!";

const ownedBy = new Set([1]);
const orders = new Map();
let orderCounter = 0;
const QR_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const orderBody = (order) => ({
  code: order.code,
  status: order.status,
  paymentMethod: order.method,
  amountVnd: 1000000,
  createdAt: order.createdAt,
  expiresAt: order.expiresAt,
  paidAt: order.status === "Paid" ? new Date().toISOString() : null,
  items: [{ kind: "Course", title: "Macaron", courseSlug: "macaron", listPriceVnd: 1000000, discountVnd: 0, unitPriceVnd: 1000000 }],
  payment:
    order.status === "Pending" && order.method === "BankTransfer"
      ? {
          amountVnd: 1000000,
          actionUrl: `${ORIGIN}/__mock/gateway`,
          fields: [
            { name: "merchant", value: "SP-TEST-1" },
            { name: "order_amount", value: "1000000" },
            { name: "order_invoice_number", value: order.code },
            { name: "success_url", value: `http://localhost:3101/checkout/${order.code}?result=success` },
            { name: "signature", value: "mock-signature" },
          ],
        }
      : null,
});
const byToken = (token) => Object.values(users).find((u) => u.token === token);

const video = (publicId, title, durationSeconds, isFree, freeTillSeconds) => ({ publicId, title, durationSeconds, isFree, freeTillSeconds: freeTillSeconds ?? null });
const lessons = [
  { id: 1, slug: "step-one", title: "Step one", sortOrder: 1, durationSeconds: 900, includedInCourse: true,
    videos: [video("aaaaaaaaaaaaaaa1", "Meringue", 600, true, 30), video("aaaaaaaaaaaaaaa2", "Piping", 300, false)] },
  { id: 2, slug: "step-two", title: "Step two", sortOrder: 2, durationSeconds: 300, includedInCourse: true,
    videos: [video("aaaaaaaaaaaaaaa3", "Baking", 300, false)] },
];
const category = { id: 1, name: "Pastry", slug: "pastry", displayOrder: 1 };
const listItem = {
  id: 1, slug: "macaron", title: "Macaron", subtitle: "Italian meringue macarons", level: "Beginner", priceVnd: 1000000,
  compareAtPriceVnd: 1200000, priceDisplay: "1.000.000 ₫", lessonCount: 2, totalDurationSeconds: 1200, categories: [category],
};
const detail = { ...listItem, images: [], includedCourses: [], includedIn: [], totalLessonCount: 2, totalDurationSecondsWithIncluded: 1200, lessons, metaDescription: "Learn to make macarons." };

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

const session = (user) => ({
  actor: user.actor,
  accessToken: user.token,
  accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  refreshToken: `refresh-${user.token}`,
  ...(user.actor === "Staff"
    ? { staff: { id: user.id, email: "admin@test.dev", displayName: user.name, role: "Admin", mustChangePassword: false } }
    : { customer: { id: user.id, email: "x@test.dev", fullName: user.name } }),
});

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return json(res, 204);
  }

  const url = new URL(req.url, ORIGIN);
  const path = url.pathname;
  const user = byToken((req.headers.authorization ?? "").replace("Bearer ", ""));
  const isOwner = user ? ownedBy.has(user.id) : false;
  let body = "";

  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    if (path === "/qr.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      return res.end(QR_PNG);
    }

    // Test-only controls: pretend the bank reported the money, or let the order lapse.
    const control = /^\/__mock\/(pay|expire)\/(\w+)$/.exec(path);
    if (control) {
      const order = orders.get(control[2]);
      if (!order) return json(res, 404, {});
      if (control[1] === "pay") {
        order.status = "Paid";
        ownedBy.add(order.customerId);
      } else {
        order.status = "Expired";
      }
      return json(res, 200, { ok: true });
    }

    // Stands in for SePay's hosted payment page: shows what the signed form carried, and a way back.
    if (path === "/__mock/gateway" && req.method === "POST") {
      const form = Object.fromEntries(new URLSearchParams(body));
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(
        `<!doctype html><title>SePay</title><h1>SePay gateway</h1>` +
          `<p id="invoice">${form.order_invoice_number}</p><p id="amount">${form.order_amount}</p>` +
          `<p id="merchant">${form.merchant}</p><p id="signature">${form.signature}</p>` +
          `<a id="back" href="${form.success_url}">Back to the shop</a>`,
      );
    }

    if (path === "/api/v1/checkout/config") return json(res, 200, { enabled: true });

    if (path === "/api/v1/orders" && req.method === "POST") {
      if (!user) return json(res, 401, {});
      if (user.actor !== "Customer") return json(res, 403, {});
      if (isOwner) return json(res, 409, { status: 409, code: "order.already_owned" });
      const existing = [...orders.values()].find((o) => o.customerId === user.id && o.status === "Pending");
      if (existing) return json(res, 200, orderBody(existing));
      const order = {
        code: `BBTEST${String(++orderCounter).padStart(2, "0")}`, customerId: user.id, status: "Pending",
        method: JSON.parse(body || "{}").method ?? "BankTransfer",
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
      orders.set(order.code, order);
      return json(res, 200, orderBody(order));
    }

    if (path === "/api/v1/me/orders") {
      if (!user) return json(res, 401, {});
      if (user.actor !== "Customer") return json(res, 403, {});
      return json(res, 200, [...orders.values()].filter((o) => o.customerId === user.id).map(orderBody));
    }

    const orderRoute = /^\/api\/v1\/orders\/(\w+)(\/cancel)?$/.exec(path);
    if (orderRoute) {
      if (!user) return json(res, 401, {});
      const order = orders.get(orderRoute[1]);
      if (!order || order.customerId !== user.id) return json(res, 404, { status: 404, code: "order.not_found" });
      if (orderRoute[2]) {
        if (order.status !== "Pending") return json(res, 409, { status: 409, code: "order.not_pending" });
        order.status = "Cancelled";
      }
      return json(res, 200, orderBody(order));
    }

    if (path.startsWith("/embed/")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end("<!doctype html><title>player</title><body style='background:#000'>player</body>");
    }

    if (path === "/api/v1/categories") return json(res, 200, [category]);

    if (path === "/api/v1/courses") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const items = q && !"macaron".includes(q) ? [] : [listItem];
      return json(res, 200, { items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
    }

    if (path === "/api/v1/courses/macaron") return json(res, 200, detail);
    if (path.startsWith("/api/v1/courses/") && !path.includes("/", 16)) return json(res, 404, { status: 404, title: "Not found" });

    if (path === "/api/v1/courses/macaron/access") {
      if (!user || user.actor !== "Customer") return json(res, 401, {});
      return json(res, 200, { hasCourseAccess: isOwner, lessonIds: [] });
    }

    const lesson = /^\/api\/v1\/courses\/macaron\/lessons\/([\w-]+)$/.exec(path);
    if (lesson) {
      if (!user) return json(res, 401, {});
      const index = lessons.findIndex((l) => l.slug === lesson[1]);
      if (index < 0) return json(res, 404, {});
      const link = (l) => (l ? { slug: l.slug, title: l.title } : null);
      return json(res, 200, {
        courseSlug: "macaron", courseTitle: "Macaron", lesson: lessons[index], hasAccess: isOwner || user.actor === "Staff",
        recipesLocked: !isOwner, recipes: isOwner ? "Whip the whites." : null, previous: link(lessons[index - 1]), next: link(lessons[index + 1]),
      });
    }

    const playback = /^\/api\/v1\/videos\/(\w+)\/playback$/.exec(path);
    if (playback) {
      const all = lessons.flatMap((l) => l.videos.map((v) => ({ v, l })));
      const hit = all.find((x) => x.v.publicId === playback[1]);
      if (!hit) return json(res, 404, {});
      if (!user && !hit.v.isFree) return json(res, 403, {});
      if (user && !isOwner && !hit.v.isFree) return json(res, 403, {});
      return json(res, 200, {
        videoId: hit.v.publicId, title: hit.v.title, url: `${ORIGIN}/embed/${hit.v.publicId}`, isFree: hit.v.isFree,
        freeTillSeconds: isOwner ? null : hit.v.freeTillSeconds, hasFullAccess: isOwner, durationSeconds: hit.v.durationSeconds,
        courseSlug: "macaron", courseTitle: "Macaron", lessonTitle: hit.l.title, lessonSlug: hit.l.slug,
      });
    }

    if (path === "/api/v1/me/courses") {
      if (!user) return json(res, 401, {});
      if (user.actor !== "Customer") return json(res, 403, {});
      return json(res, 200, isOwner ? [{ courseId: 1, slug: "macaron", title: "Macaron", hasCourseAccess: true, lessons: [] }] : []);
    }

    if (path === "/api/v1/auth/login") {
      const { email, password } = JSON.parse(body || "{}");
      const match = users[email];
      return match && password === PASSWORD ? json(res, 200, session(match)) : json(res, 401, { status: 401, code: "customer.invalid_credentials" });
    }

    if (path === "/api/v1/auth/refresh") {
      const { refreshToken } = JSON.parse(body || "{}");
      const match = Object.values(users).find((u) => `refresh-${u.token}` === refreshToken);
      return match ? json(res, 200, session(match)) : json(res, 401, {});
    }

    if (path === "/api/v1/auth/logout") return json(res, 204);

    json(res, 404, { status: 404, title: "No such mock route", path });
  });
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock api on ${ORIGIN}`));
