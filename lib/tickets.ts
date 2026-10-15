import { z } from 'zod';
export const categories = ['Facilities', 'Technology', 'Hostel', 'Academics'] as const;
export const statuses = ['Open', 'In progress', 'Resolved'] as const;
export const priorities = ['Low', 'Medium', 'High'] as const;
export const ticketInput = z.object({title:z.string().trim().min(5).max(120),description:z.string().trim().min(10).max(2000),category:z.enum(categories),location:z.string().trim().min(2).max(100),priority:z.enum(priorities)});
export const ticketUpdate = z.object({id:z.string().uuid(),status:z.enum(statuses),assignee:z.string().trim().max(80)});
export type Ticket = z.infer<typeof ticketInput> & {id:string;status:string;assignee:string;created:number};
