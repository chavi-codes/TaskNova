import React from 'react';
import { Calendar, Clock, ListTodo } from 'lucide-react';

export default function PlannerView({ lists, onCardClick }) {
  // Aggregate all cards with due dates
  const allCards = lists.flatMap((l) =>
    l.cards.map((c) => ({ ...c, listTitle: l.title, listId: l.id }))
  );

  const upcomingCards = allCards.filter((c) => c.dueDate);
  const unscheduledCards = allCards.filter((c) => !c.dueDate);

  return (
    <div className="planner-view">
      <div className="planner-header">
        <Calendar size={28} className="planner-header-icon" />
        <div>
          <h2 className="planner-title">Planner Schedule View</h2>
          <p className="planner-subtitle">
            Organize tasks by target completion dates and track deadlines.
          </p>
        </div>
      </div>

      <div className="planner-grid">
        {/* Scheduled Tasks */}
        <div className="planner-panel">
          <div className="planner-panel-title scheduled">
            <Clock size={20} />
            <h3>Scheduled Tasks ({upcomingCards.length})</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingCards.length === 0 ? (
              <div className="planner-empty-state">
                <Clock size={22} />
                <p>Nothing scheduled yet — add a due date to a card to see it here.</p>
              </div>
            ) : (
              upcomingCards.map((card) => (
                <div
                  key={card.id}
                  className="kanban-card planner-card"
                  onClick={() => onCardClick(card, card.listId)}
                >
                  <div>
                    <div className="card-title">{card.title}</div>
                    <div className="planner-card-meta">
                      In List: <strong className="planner-card-list">{card.listTitle}</strong>
                    </div>
                  </div>
                  <div className="planner-due-pill">
                    📅 {card.dueDate}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Backlog / Unscheduled Tasks */}
        <div className="planner-panel">
          <div className="planner-panel-title unscheduled">
            <ListTodo size={20} />
            <h3>Unscheduled Backlog ({unscheduledCards.length})</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unscheduledCards.length === 0 ? (
              <div className="planner-empty-state">
                <ListTodo size={22} />
                <p>Every card has a due date — nice and tidy.</p>
              </div>
            ) : (
              unscheduledCards.map((card) => (
                <div
                  key={card.id}
                  className="kanban-card planner-card"
                  onClick={() => onCardClick(card, card.listId)}
                >
                  <div>
                    <div className="card-title">{card.title}</div>
                    <div className="planner-card-meta">
                      In List: <strong className="planner-card-list">{card.listTitle}</strong>
                    </div>
                  </div>
                  <div className="planner-card-meta">Click to set date</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
