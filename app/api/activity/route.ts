import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { activity, tickets } from "../../../db/schema";
const input = z.object({
  ticketId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
});

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  const ticketId = new URL(request.url).searchParams.get("ticketId");
  if (!ticketId)
    return Response.json({ error: "Ticket ID required" }, { status: 400 });
  const db = getDb();
  const ticket = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.owner, user.userId)))
    .get();
  if (!ticket)
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  return Response.json(
    await db
      .select()
      .from(activity)
      .where(
        and(eq(activity.ticketId, ticketId), eq(activity.owner, user.userId)),
      )
      .orderBy(asc(activity.created)),
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = input.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Enter a comment between 1 and 1,000 characters." },
      { status: 400 },
    );
  const db = getDb();
  const ticket = await db
    .select()
    .from(tickets)
    .where(
      and(eq(tickets.id, parsed.data.ticketId), eq(tickets.owner, user.userId)),
    )
    .get();
  if (!ticket)
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  const row = {
    ...parsed.data,
    id: crypto.randomUUID(),
    owner: user.userId,
    author: user.displayName,
    kind: "comment",
    created: Date.now(),
  };
  await db.insert(activity).values(row);
  return Response.json(row, { status: 201 });
}
