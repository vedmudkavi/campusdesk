"use client";
import { MapPin, ArrowUpRight } from "lucide-react";
import { statuses, type Ticket } from "../lib/tickets";
export function IssueBoard({
  tickets,
  onSelect,
}: {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}) {
  return (
    <div className="issue-board">
      {statuses.map((status) => {
        const list = tickets.filter((ticket) => ticket.status === status);
        return (
          <section
            className="board-column"
            key={status}
            aria-label={`${status} issues`}
          >
            <h3>
              <span
                className={"pill " + status.replaceAll(" ", "-").toLowerCase()}
              >
                ● {status}
              </span>
              <span>{list.length}</span>
            </h3>
            {list.map((ticket) => (
              <button
                className="board-card"
                key={ticket.id}
                onClick={() => onSelect(ticket)}
              >
                <span className="card-category">
                  {ticket.category}
                  <ArrowUpRight size={15} />
                </span>
                <strong>{ticket.title}</strong>
                <span className="card-location">
                  <MapPin size={12} />
                  {ticket.location}
                </span>
                <span className="card-bottom">
                  <span className={"priority " + ticket.priority.toLowerCase()}>
                    ▥ {ticket.priority}
                  </span>
                  <span>{ticket.assignee || "Unassigned"}</span>
                </span>
              </button>
            ))}
            {!list.length && (
              <p className="board-empty">
                No issues here.
                <br />A little breathing room.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
