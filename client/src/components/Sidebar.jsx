import React, { useState } from 'react';
import { Inbox, Plus, SlidersHorizontal, MoreHorizontal, Mail } from 'lucide-react';

export default function Sidebar({ inboxList, isOpen, onCardClick, onAddInboxCard }) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddInboxCard(newCardTitle.trim());
    setNewCardTitle('');
    setIsAdding(false);
  };

  return (
    <aside className="sidebar-inbox">
      <div className="inbox-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Inbox size={18} />
          <span>Inbox</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="board-btn" style={{ padding: '4px' }}>
            <SlidersHorizontal size={14} />
          </button>
          <button className="board-btn" style={{ padding: '4px' }}>
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {isAdding ? (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="inline-form-input"
            placeholder="Add a card..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="submit"
              className="btn-create"
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Add Card
            </button>
            <button
              type="button"
              className="board-btn"
              onClick={() => setIsAdding(false)}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="inbox-card-add" onClick={() => setIsAdding(true)}>
          <Plus size={16} />
          <span>Add a card</span>
        </button>
      )}

      {/* Inbox Cards */}
      <div className="cards-container" style={{ flex: 1 }}>
        {inboxList?.cards?.map((card) => (
          <div
            key={card.id}
            className="kanban-card"
            onClick={() => onCardClick(card, inboxList.id)}
          >
            {card.labels && card.labels.length > 0 && (
              <div className="card-labels">
                {card.labels.map((lbl) => (
                  <span
                    key={lbl.id}
                    className="label-pill"
                    style={{ backgroundColor: lbl.color }}
                  >
                    {lbl.name}
                  </span>
                ))}
              </div>
            )}
            <div className="card-title">{card.title}</div>
            {card.description && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {card.description.slice(0, 65)}...
              </div>
            )}
            <div className="card-meta">
              <Mail size={12} />
              <span>Inbox note</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
