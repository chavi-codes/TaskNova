import React, { useState } from 'react';
import { Plus, MoreHorizontal, ArrowRightLeft, Calendar, CheckSquare, Play, Trash2 } from 'lucide-react';

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

const COLOR_PRESETS = [
  '#431407', // Brown
  '#713f12', // Olive
  '#064e3b', // Emerald
  '#171717', // Dark Charcoal
  '#1e1b4b', // Deep Indigo
  '#831843'  // Deep Rose
];

export default function BoardView({ lists, searchQuery, onCardClick, onAddCard, onAddList, onDeleteList, onMoveCard }) {
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [addingCardToListId, setAddingCardToListId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Drag & drop state
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [sourceListId, setSourceListId] = useState(null);

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const randomColor = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
    onAddList(newListTitle.trim(), randomColor);
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleCreateCard = (listId, e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(listId, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCardToListId(null);
  };

  // Drag & drop event handlers
  const handleDragStart = (cardId, listId) => {
    setDraggedCardId(cardId);
    setSourceListId(listId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetListId) => {
    if (draggedCardId && sourceListId && sourceListId !== targetListId) {
      onMoveCard(draggedCardId, sourceListId, targetListId);
    }
    setDraggedCardId(null);
    setSourceListId(null);
  };

  // Filter lists without Inbox (since inbox is in sidebar)
  const boardLists = lists.filter((l) => !l.isInbox);

  return (
    <div className="board-workspace">
      {boardLists.map((list) => {
        // Filter cards by search query
        const filteredCards = list.cards.filter((c) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q)) ||
            (c.labels && c.labels.some((l) => l.name.toLowerCase().includes(q))) ||
            (c.typeOfWork && c.typeOfWork.toLowerCase().startsWith(q))
          );
        });

        return (
          <div
            key={list.id}
            className="kanban-list"
            style={{ backgroundColor: list.color || '#22272b' }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(list.id)}
          >
            {/* List Header */}
            <div className="list-header">
              <div className="list-title-box">
                <span>{list.title}</span>
                <span className="list-count">{filteredCards.length} ➔</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className="board-btn"
                  style={{ padding: '2px 4px' }}
                  onClick={() => onDeleteList(list.id)}
                  title="Delete list"
                >
                  <Trash2 size={13} />
                </button>
                <button className="board-btn" style={{ padding: '2px 4px' }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="cards-container">
              {filteredCards.length === 0 ? (
                searchQuery ? (
                  <div className="empty-search-message" style={{ textAlign: 'center', padding: '16px 8px', fontSize: '12px', color: '#94a3b8', width: '100%', fontStyle: 'italic' }}>
                    No matching tasks found
                  </div>
                ) : null
              ) : (
                filteredCards.map((card) => {
                  const totalCheck = card.checklist?.length || 0;
                  const doneCheck = card.checklist?.filter((c) => c.completed).length || 0;

                  return (
                    <div
                      key={card.id}
                      className={`kanban-card ${card.typeOfWork ? 'type-' + card.typeOfWork.toLowerCase() : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(card.id, list.id)}
                      onClick={() => onCardClick(card, list.id)}
                    >
                      {/* Optional Video Demo / Media Cover */}
                      {card.cover === 'video_demo' && (
                        <div className="card-cover-media">
                          <div className="play-btn-circle">
                            <Play size={20} fill="#0284c7" />
                          </div>
                        </div>
                      )}

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
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {card.description.slice(0, 55)}...
                        </div>
                      )}

                      {/* Meta Badges */}
                      {(card.dueDate || totalCheck > 0 || card.typeOfWork) && (
                        <div className="card-meta">
                          {card.typeOfWork && (
                            <div className={`card-badge type-${card.typeOfWork.toLowerCase()}`}>
                              <span className="type-dot">●</span>
                              <span style={{ textTransform: 'capitalize' }}>{card.typeOfWork}</span>
                            </div>
                          )}

                          {card.dueDate && (
                            <div className={`card-badge ${new Date(card.dueDate) < new Date() ? 'due' : ''}`}>
                              <Calendar size={12} />
                              <span>{card.dueDate}</span>
                            </div>
                          )}

                          {totalCheck > 0 && (
                            <div className="card-badge">
                              <CheckSquare size={12} />
                              <span>
                                {doneCheck}/{totalCheck}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Card Form inside List */}
            {addingCardToListId === list.id ? (
              <form onSubmit={(e) => handleCreateCard(list.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  className="inline-form-input"
                  placeholder="Enter a title for this card..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" className="btn-create" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    Add card
                  </button>
                  <button
                    type="button"
                    className="board-btn"
                    onClick={() => setAddingCardToListId(null)}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="btn-add-card"
                onClick={() => {
                  setAddingCardToListId(list.id);
                  setNewCardTitle('');
                }}
              >
                <Plus size={16} />
                <span>Add a card</span>
              </button>
            )}
          </div>
        );
      })}

      {/* Add another list button */}
      <div className="add-list-box">
        {isAddingList ? (
          <form onSubmit={handleCreateList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              className="inline-form-input"
              placeholder="Enter list title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="btn-create" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Add List
              </button>
              <button
                type="button"
                className="board-btn"
                onClick={() => setIsAddingList(false)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="btn-add-list" onClick={() => setIsAddingList(true)}>
            <Plus size={18} />
            <span>Add another list</span>
          </button>
        )}
      </div>
    </div>
  );
}
