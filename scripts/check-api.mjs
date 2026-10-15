import assert from "node:assert/strict";
const base = "http://127.0.0.1:5173";
const sign = await fetch(base + "/signin-with-chatgpt?return_to=/", {
  redirect: "manual",
});
const cookie = sign.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Local development sign-in cookie");
const headers = { cookie, origin: base, "Content-Type": "application/json" };
assert.equal((await fetch(base + "/api/tickets")).status, 401);
assert.equal(
  (
    await fetch(base + "/api/tickets", {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "x" }),
    })
  ).status,
  400,
);
assert.equal(
  (
    await fetch(base + "/api/tickets", {
      method: "POST",
      headers: { ...headers, origin: "https://wrong.example" },
      body: "{}",
    })
  ).status,
  403,
);
const response = await fetch(base + "/api/tickets", {
  method: "POST",
  headers,
  body: JSON.stringify({
    title: "Library Wi-Fi unavailable",
    description: "The reading room network is not connecting.",
    category: "Technology",
    location: "Library, floor 2",
    priority: "High",
  }),
});
assert.equal(response.status, 201);
const row = await response.json();
const patch = await fetch(base + "/api/tickets", {
  method: "PATCH",
  headers,
  body: JSON.stringify({ id: row.id, status: "Resolved", assignee: "IT team" }),
});
assert.equal(patch.status, 200);
const list = await (await fetch(base + "/api/tickets", { headers })).json();
assert.equal(list.find((x) => x.id === row.id).status, "Resolved");
assert.equal(
  (
    await fetch(base + "/api/tickets", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        id: crypto.randomUUID(),
        status: "Open",
        assignee: "IT",
      }),
    })
  ).status,
  404,
);
console.log(
  "PASS: sign-in, anonymous denial, validation, origin check, create, update, persistence, missing ticket.",
);
const activityUrl = base + "/api/activity?ticketId=" + row.id;
assert.equal((await fetch(activityUrl)).status, 401);
let history = await (await fetch(activityUrl, { headers })).json();
assert.deepEqual(
  history.map((x) => x.kind),
  ["created", "update"],
);
assert.match(history[1].message, /Resolved/);
assert.equal(
  (
    await fetch(base + "/api/activity", {
      method: "POST",
      headers,
      body: JSON.stringify({ ticketId: row.id, message: "   " }),
    })
  ).status,
  400,
);
assert.equal(
  (
    await fetch(base + "/api/activity", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ticketId: crypto.randomUUID(),
        message: "Missing issue",
      }),
    })
  ).status,
  404,
);
assert.equal(
  (
    await fetch(base + "/api/activity?ticketId=" + crypto.randomUUID(), {
      headers,
    })
  ).status,
  404,
);
const comment = await fetch(base + "/api/activity", {
  method: "POST",
  headers,
  body: JSON.stringify({
    ticketId: row.id,
    message: "Connection restored after access point restart.",
  }),
});
assert.equal(comment.status, 201);
const saved = await comment.json();
assert.ok(saved.author);
assert.equal(saved.kind, "comment");
history = await (await fetch(activityUrl, { headers })).json();
assert.equal(history.length, 3);
assert.equal(history[2].message, saved.message);
await fetch(base + "/api/tickets", {
  method: "PATCH",
  headers,
  body: JSON.stringify({ id: row.id, status: "Resolved", assignee: "IT team" }),
});
assert.equal(
  (await (await fetch(activityUrl, { headers })).json()).length,
  3,
  "No-op updates must not add duplicate events",
);
console.log(
  "PASS: audit history, comment validation, comment persistence, authenticated authors, anonymous denial, missing tickets, no-op deduplication.",
);
