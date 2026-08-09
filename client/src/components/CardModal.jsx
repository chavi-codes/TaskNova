import React, { useState } from 'react';
import { X, CheckSquare, Tag, Calendar, Move, Trash2, AlignLeft, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_LABELS = [
  { id: 'lbl-1', name: 'Feature', color: '#0ea5e9' },
  { id: 'lbl-2', name: 'Quick Note', color: '#8b5cf6' },
  { id: 'lbl-3', name: 'Guide', color: '#f59e0b' },
  { id: 'lbl-4', name: 'Important', color: '#ef4444' },
  { id: 'lbl-5', name: 'High Priority', color: '#10b981' }
];

export default function CardModal({ card, listId, lists, onClose, onUpdateCard, onDeleteCard, onMoveCard, autoMoveSetting = true }) {
  if (!card) return null;

  const { user } = useAuth();

  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [labels, setLabels] = useState(card.labels || []);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(card.comments || []);
  const [targetListId, setTargetListId] = useState(listId);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [pendingChecklist, setPendingChecklist] = useState(null);

  // Checklist Calculations
  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPercent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleSaveAll = () => {
    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments
    });
    if (targetListId !== listId) {
      onMoveCard(card.id, listId, targetListId);
    }
    onClose();
  };

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = { id: `chk-${Date.now()}`, text: newChecklistItem.trim(), completed: false };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistItem('');
  };

  const toggleChecklist = async (id) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);

    const isNowAllCompleted = updated.length > 0 && updated.every((item) => item.completed);
    const wasAllCompletedBefore = checklist.length > 0 && checklist.every((item) => item.completed);

    // If checklist just completed, auto-move to Done list
    if (isNowAllCompleted && !wasAllCompletedBefore) {
      const currentList = lists.find((l) => l.id === listId);
      const isDoneList = currentList?.title.toLowerCase() === 'done';
      if (!isDoneList) {
        const doneList = lists.find((l) => l.title.toLowerCase() === 'done');
        if (doneList) {
          if (autoMoveSetting) {
            // Await updates to ensure state consistency
            await onUpdateCard(card.id, {
              title,
              description,
              dueDate,
              checklist: updated,
              labels,
              comments
            });
            await onMoveCard(card.id, listId, doneList.id);
            onClose();
          } else {
            // Fallback to confirmation dialog
            setPendingChecklist(updated);
            setShowMoveConfirm(true);
          }
        }
      }
    }
  };

  const handleConfirmMove = () => {
    const doneList = lists.find((l) => l.title.toLowerCase() === 'done');
    if (doneList) {
      onUpdateCard(card.id, {
        title,
        description,
        dueDate,
        checklist: pendingChecklist || checklist,
        labels,
        comments
      });
      onMoveCard(card.id, listId, doneList.id);
      onClose();
    }
    setShowMoveConfirm(false);
  };

  const handleCancelMove = () => {
    const updatedChecklist = pendingChecklist || checklist;
    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist: updatedChecklist,
      labels,
      comments
    });
    setShowMoveConfirm(false);
    setPendingChecklist(null);
  };

  const toggleLabel = (labelObj) => {
    const exists = labels.some((l) => l.name === labelObj.name);
    if (exists) {
      setLabels(labels.filter((l) => l.name !== labelObj.name));
    } else {
      setLabels([...labels, labelObj]);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const c = { id: `c-${Date.now()}`, user: user?.initials || 'You', text: newComment.trim(), createdAt: new Date().toISOString() };
    setComments([c, ...comments]);
    setNewComment('');
  };

  return (
    <div className="modal-overlay" onClick={handleSaveAll}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input
            type="text"
            className="modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="modal-close-btn" onClick={handleSaveAll}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-grid">
          <div className="modal-left">
            {/* Labels */}
            <div className="modal-section">
              <div className="section-title">
                <Tag size={16} />
                <span>Labels</span>
              </div>
              <div className="card-labels" style={{ gap: '6px' }}>
                {PRESET_LABELS.map((preset) => {
                  const active = labels.some((l) => l.name === preset.name);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => toggleLabel(preset)}
                      className="label-pill"
                      style={{
                        backgroundColor: preset.color,
                        opacity: active ? 1 : 0.4,
                        border: active ? '2px solid white' : 'none',
                        cursor: 'pointer',
                        padding: '4px 10px'
                      }}
                    >
                      {preset.name} {active && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="modal-section">
              <div className="section-title">
                <AlignLeft size={16} />
                <span>Description</span>
              </div>
              <textarea
                className="modal-textarea"
                placeholder="Add a detailed description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Checklist */}
            <div className="modal-section">
              <div className="section-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={16} />
                  <span>Checklist ({progressPercent}%)</span>
                </div>
              </div>
              {checklist.length > 0 && (
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              )}

              {checklist.map((item) => (
                <div key={item.id} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span
                    className={`checklist-item-text${item.completed ? ' completed' : ''}`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}

              <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  className="modal-mini-input"
                  placeholder="Add item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-create" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>

            {/* Activity / Comments */}
            <div className="modal-section">
              <div className="section-title">
                <MessageSquare size={16} />
                <span>Activity & Comments</span>
              </div>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="modal-mini-input"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-create" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Save
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-author">
                      {c.user}
                    </div>
                    <div>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Options */}
          <div className="modal-sidebar-btns">
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>ACTIONS</span>

            {/* Move Card */}
            <div className="side-btn">
              <Move size={14} />
              <select
                value={targetListId}
                onChange={(e) => setTargetListId(e.target.value)}
                className="modal-select"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    List: {l.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="side-btn" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} />
                <span>Due Date</span>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="modal-mini-input"
                style={{ padding: '4px 6px', fontSize: '12px' }}
              />
            </div>

            {/* Delete Card */}
            <button
              className="side-btn danger"
              onClick={() => {
                onDeleteCard(card.id);
                onClose();
              }}
            >
              <Trash2 size={14} />
              <span>Delete Card</span>
            </button>
          </div>
        </div>
      </div>

      {showMoveConfirm && (
        <div className="confirm-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="confirm-dialog" style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '28px',
            width: '340px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '18px', fontWeight: '600' }}>Checklist completed!</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>Move this task to Done?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleConfirmMove} style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}>
                Move
              </button>
              <button onClick={handleCancelMove} style={{
                backgroundColor: '#334155',
                color: '#cbd5e1',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#334155'}>
                Keep Here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
