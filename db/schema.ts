import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  assignee: text("assignee").notNull(),
  created: integer("created").notNull(),
});

export const activity = sqliteTable("activity", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  owner: text("owner").notNull(),
  author: text("author").notNull(),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  created: integer("created").notNull(),
});
