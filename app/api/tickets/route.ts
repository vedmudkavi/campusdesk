import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { tickets } from '../../../db/schema';
import { ticketInput, ticketUpdate } from '../../../lib/tickets';
import { and, eq, desc } from 'drizzle-orm';
export async function GET() {
 const user=await getChatGPTUser(); if(!user) return Response.json({error:'Please sign in to access your workspace.'},{status:401});
 const rows=await getDb().select().from(tickets).where(eq(tickets.owner,user.userId)).orderBy(desc(tickets.created));
 return Response.json(rows,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request) { return mutate(request,false); }
export async function PATCH(request:Request) { return mutate(request,true); }
async function mutate(request:Request, update:boolean) {
 if(request.headers.get('origin')!==new URL(request.url).origin) return Response.json({error:'Invalid origin'},{status:403});
 const user=await getChatGPTUser(); if(!user) return Response.json({error:'Please sign in first.'},{status:401});
 let body;try {body=await request.json()}catch{return Response.json({error:'Invalid JSON'},{status:400})}
 const parsed=(update?ticketUpdate:ticketInput).safeParse(body);
 if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});
 if(update){
 const data=ticketUpdate.parse(body);
 const rows=await getDb().update(tickets).set({status:data.status,assignee:data.assignee}).where(and(eq(tickets.id,data.id),eq(tickets.owner,user.userId))).returning();
 if(!rows.length)return Response.json({error:'Ticket not found'},{status:404});
 return Response.json(rows[0]);
 }
 const row={...ticketInput.parse(body),id:crypto.randomUUID(),owner:user.userId,status:'Open',assignee:'Unassigned',created:Date.now()};
 await getDb().insert(tickets).values(row);return Response.json(row,{status:201});
}
