import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { tickets, activity } from "../../../db/schema";
import { ticketInput, ticketUpdate } from "../../../lib/tickets";
import { and, eq, desc } from "drizzle-orm";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json(
      { error: "Please sign in to access your workspace." },
      { status: 401 },
    );
  const rows = await getDb()
    .select()
    .from(tickets)
    .where(eq(tickets.owner, user.userId))
    .orderBy(desc(tickets.created));
  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  return mutate(request, false);
}
export async function PATCH(request: Request) {
  return mutate(request, true);
}
async function mutate(request: Request, update: boolean) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = (update ? ticketUpdate : ticketInput).safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  if (update) {
    const data = ticketUpdate.parse(body);
    const db = getDb();
    const current = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, data.id), eq(tickets.owner, user.userId)))
      .get();
    if (!current)
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    if (current.status === data.status && current.assignee === data.assignee)
      return Response.json(current);
    // D1 batches commit the change and its audit record atomically.
    const [rows] = await db.batch([
      db
        .update(tickets)
        .set({ status: data.status, assignee: data.assignee })
        .where(and(eq(tickets.id, data.id), eq(tickets.owner, user.userId)))
        .returning(),
      db
        .insert(activity)
        .values({
          id: crypto.randomUUID(),
          ticketId: data.id,
          owner: user.userId,
          author: user.displayName,
          kind: "update",
          message: `Status set to ${data.status}; assigned to ${data.assignee || "Unassigned"}.`,
          created: Date.now(),
        }),
    ]);
    return Response.json(rows[0]);
  }
  const row = {
    ...ticketInput.parse(body),
    id: crypto.randomUUID(),
    owner: user.userId,
    status: "Open",
    assignee: "Unassigned",
    created: Date.now(),
  };
  await getDb().batch([
    getDb().insert(tickets).values(row),
    getDb()
      .insert(activity)
      .values({
        id: crypto.randomUUID(),
        ticketId: row.id,
        owner: user.userId,
        author: user.displayName,
        kind: "created",
        message: "Issue reported",
        created: row.created,
      }),
  ]);
  return Response.json(row, { status: 201 });
}
