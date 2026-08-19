import React, { useState } from 'react';
import { Inbox, Plus, Mail } from 'lucide-react';

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 150 ? '#111827' : '#ffffff';
};

export default function InboxView({ inboxList, onCardClick, onAddInboxCard }) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddInboxCard(newCardTitle.trim());
    setNewCardTitle('');
    setIsAdding(false);
  };

  return (
    <div className="inbox-view-container">
      <div className="inbox-view-header">
        <div className="inbox-view-title-box">
          <Inbox size={22} className="inbox-view-icon" />
          <h2>Inbox</h2>
        </div>
        <p className="inbox-view-subtitle">
          Capture notes, quick tasks, or ideas before organizing them into lists or sprints.
        </p>
      </div>

      <div className="inbox-view-content">
        {/* Add Card Section */}
        <div className="inbox-add-section">
          {isAdding ? (
            <form onSubmit={handleAdd} className="inbox-add-form">
              <input
                type="text"
                className="inline-form-input"
                placeholder="What's on your mind? Enter a title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-create" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  Add Card
                </button>
                <button
                  type="button"
                  className="board-btn"
                  onClick={() => setIsAdding(false)}
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button className="inbox-card-add-btn" onClick={() => setIsAdding(true)}>
              <Plus size={18} />
              <span>Add a card to Inbox</span>
            </button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="inbox-cards-grid">
          {inboxList?.cards?.length === 0 ? (
            <div className="inbox-empty-state">
              <Mail size={40} className="inbox-empty-icon" />
              <p>Your Inbox is empty.</p>
              <span>Add cards to capture quick tasks or notes.</span>
            </div>
          ) : (
            inboxList.cards.map((card) => (
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
                        style={{ backgroundColor: lbl.color, color: getContrastColor(lbl.color) }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="card-title">{card.title}</div>
                {card.description && (
                  <div className="card-description-preview">
                    {card.description.slice(0, 100)}
                    {card.description.length > 100 ? '...' : ''}
                  </div>
                )}
                <div className="card-meta">
                  <Mail size={12} />
                  <span>Inbox note</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
