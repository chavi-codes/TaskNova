import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Tag,
  Calendar,
  Move,
  Trash2,
  AlignLeft,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Pencil,
  Trash,
  Link,
  Briefcase,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

const DEFAULT_LABELS = [];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#10b981', // Green
  '#f57c00', // Orange
  '#ec4899', // Pink
  '#eab308'  // Yellow
];

export default function CardModal({
  card,
  listId,
  lists,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  autoMoveSetting = true
}) {
  if (!card) return null;

  const { user, token } = useAuth();

  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [typeOfWork, setTypeOfWork] = useState(card.typeOfWork || 'task');

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklist, setChecklist] = useState(card.checklist || []);

  const [labels, setLabels] = useState(card.labels || []);
  const [availableLabels, setAvailableLabels] = useState(DEFAULT_LABELS);

  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');

  const [showAddLabel, setShowAddLabel] = useState(false);
  const [showManageLabels, setShowManageLabels] = useState(false);

  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState('#3b82f6');

  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(card.comments || []);

  const [targetListId, setTargetListId] = useState(listId);

  const [subtasks, setSubtasks] = useState(card.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const [activeDescChecklistId, setActiveDescChecklistId] = useState(null);
  const [activeDescSubtaskId, setActiveDescSubtaskId] = useState(null);
  const [editingDescText, setEditingDescText] = useState('');

  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPercent = checklist.length
    ? Math.round((completedCount / checklist.length) * 100)
    : 0;

  const prevCardRef = useRef(card);

  useEffect(() => {
    const prevCard = prevCardRef.current;
    if (card.id !== prevCard.id) {
      // New card opened: reset all states to fresh card prop values
      setTitle(card.title || '');
      setDescription(card.description || '');
      setDueDate(card.dueDate || '');
      setTypeOfWork(card.typeOfWork || 'task');
      setChecklist(card.checklist || []);
      setLabels(card.labels || []);
      setComments(card.comments || []);
      setSubtasks(card.subtasks || []);
      setTargetListId(listId);
      setActiveDescChecklistId(null);
      setActiveDescSubtaskId(null);
      setEditingDescText('');
    } else {
      // Same card updated: sync states if they have not been edited locally (keeps user inputs safe)
      if (card.title !== prevCard.title && title === prevCard.title) {
        setTitle(card.title || '');
      }
      if (card.description !== prevCard.description && description === prevCard.description) {
        setDescription(card.description || '');
      }
      if (card.dueDate !== prevCard.dueDate) setDueDate(card.dueDate || '');
      if (card.typeOfWork !== prevCard.typeOfWork) setTypeOfWork(card.typeOfWork || 'task');
      if (card.checklist !== prevCard.checklist) setChecklist(card.checklist || []);
      if (card.labels !== prevCard.labels) setLabels(card.labels || []);
      if (card.comments !== prevCard.comments) setComments(card.comments || []);
      if (card.subtasks !== prevCard.subtasks) setSubtasks(card.subtasks || []);
    }
    prevCardRef.current = card;
  }, [card, listId]);

  // ------------------------------------------------------------
  // Load global labels
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadLabels() {
      try {
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch('/api/labels', { headers });

        if (!res.ok) return;

        const data = await res.json();

        if (!cancelled && Array.isArray(data.labels)) {
          setAvailableLabels(data.labels);
        }
      } catch (error) {
        console.error('Could not load labels:', error);
      }
    }

    loadLabels();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ------------------------------------------------------------
  // Save card
  // ------------------------------------------------------------
  const handleSaveAll = async () => {
    await onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks,
      typeOfWork
    });

    if (targetListId !== listId) {
      await onMoveCard(card.id, listId, targetListId);
    }

    onClose();
  };

  // ------------------------------------------------------------
  // Checklist
  // ------------------------------------------------------------
  const handleAddChecklist = (e) => {
    e.preventDefault();

    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistItem.trim(),
      completed: false
    };

    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
  };

  const toggleChecklist = async (id) => {
    const updated = checklist.map((item) =>
      item.id === id
        ? { ...item, completed: !item.completed }
        : item
    );

    setChecklist(updated);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist: updated,
      labels,
      comments,
      subtasks,
      typeOfWork
    });
  };

  // ------------------------------------------------------------
  // Labels
  // ------------------------------------------------------------
  const toggleLabel = (label) => {
    const exists = labels.some(
      (item) => item.id === label.id
    );

    let updatedLabels;
    if (exists) {
      updatedLabels = labels.filter((item) => item.id !== label.id);
    } else {
      updatedLabels = [...labels, label];
    }
    setLabels(updatedLabels);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels: updatedLabels,
      comments,
      subtasks,
      typeOfWork
    });
  };

  const handleClearLabels = () => {
    setLabels([]);
    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels: [],
      comments,
      subtasks,
      typeOfWork
    });
  };

  const handleUpdateTypeOfWork = (val) => {
    setTypeOfWork(val);
    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks,
      typeOfWork: val
    });
  };

  // ------------------------------------------------------------
  // Subtasks
  // ------------------------------------------------------------
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      status: 'todo'
    };

    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    setShowAddSubtask(false);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks: updated,
      typeOfWork
    });
  };

  const handleUpdateSubtaskStatus = (id, newStatus) => {
    const updated = subtasks.map((sub) =>
      sub.id === id ? { ...sub, status: newStatus } : sub
    );
    setSubtasks(updated);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks: updated,
      typeOfWork
    });
  };

  const handleToggleSubtaskCheckbox = (sub) => {
    const newStatus = sub.status === 'done' ? 'todo' : 'done';
    handleUpdateSubtaskStatus(sub.id, newStatus);
  };

  const handleDeleteSubtask = (id) => {
    const updated = subtasks.filter((sub) => sub.id !== id);
    setSubtasks(updated);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks: updated,
      typeOfWork
    });
  };

  const handleStartEditSubtask = (sub) => {
    setEditingSubtaskId(sub.id);
    setEditingSubtaskTitle(sub.title);
  };

  const handleSaveSubtaskTitle = (id) => {
    if (!editingSubtaskTitle.trim()) return;
    const updated = subtasks.map((sub) =>
      sub.id === id ? { ...sub, title: editingSubtaskTitle.trim() } : sub
    );
    setSubtasks(updated);
    setEditingSubtaskId(null);

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks: updated,
      typeOfWork
    });
  };

  const handleToggleChecklistDesc = (item) => {
    setActiveDescSubtaskId(null);
    if (activeDescChecklistId === item.id) {
      setActiveDescChecklistId(null);
      setEditingDescText('');
    } else {
      setActiveDescChecklistId(item.id);
      setEditingDescText(item.description || '');
    }
  };

  const handleSaveChecklistDesc = async (itemId) => {
    const updated = checklist.map((item) =>
      item.id === itemId
        ? { ...item, description: editingDescText.trim() }
        : item
    );
    setChecklist(updated);
    setActiveDescChecklistId(null);
    setEditingDescText('');

    await onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist: updated,
      labels,
      comments,
      subtasks,
      typeOfWork
    });
  };

  const handleToggleSubtaskDesc = (sub) => {
    setActiveDescChecklistId(null);
    if (activeDescSubtaskId === sub.id) {
      setActiveDescSubtaskId(null);
      setEditingDescText('');
    } else {
      setActiveDescSubtaskId(sub.id);
      setEditingDescText(sub.description || '');
    }
  };

  const handleSaveSubtaskDesc = async (subId) => {
    const updated = subtasks.map((sub) =>
      sub.id === subId
        ? { ...sub, description: editingDescText.trim() }
        : sub
    );
    setSubtasks(updated);
    setActiveDescSubtaskId(null);
    setEditingDescText('');

    await onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks: updated,
      typeOfWork
    });
  };

  const filteredLabels = availableLabels.filter((label) =>
    label.name
      .toLowerCase()
      .includes(labelSearch.toLowerCase())
  );

  const createLabel = async () => {
    const name = newLabelName.trim();

    if (!name) return;

    const duplicate = availableLabels.some(
      (label) =>
        label.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      alert('A label with this name already exists.');
      return;
    }

    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {})
        },
        body: JSON.stringify({
          name,
          color: newLabelColor
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Could not create label.'
        );
      }

      const createdLabel = data.label;

      setAvailableLabels((prev) => [
        ...prev,
        createdLabel
      ]);

      setLabels((prev) => [
        ...prev,
        createdLabel
      ]);

      setNewLabelName('');
      setNewLabelColor('#3b82f6');
      setShowAddLabel(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const startEditLabel = (label) => {
    setEditingLabelId(label.id);
    setEditingLabelName(label.name);
    setEditingLabelColor(label.color);
  };

  const cancelEditLabel = () => {
    setEditingLabelId(null);
    setEditingLabelName('');
    setEditingLabelColor('#3b82f6');
  };

  const saveEditedLabel = async (labelId) => {
    const name = editingLabelName.trim();

    if (!name) return;

    try {
      const res = await fetch(
        `/api/labels/${labelId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {})
          },
          body: JSON.stringify({
            name,
            color: editingLabelColor
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Could not update label.'
        );
      }

      const updatedLabel = data.label;

      setAvailableLabels((prev) =>
        prev.map((label) =>
          label.id === labelId
            ? updatedLabel
            : label
        )
      );

      // Update the label inside the current card too.
      setLabels((prev) =>
        prev.map((label) =>
          label.id === labelId
            ? updatedLabel
            : label
        )
      );

      cancelEditLabel();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteLabel = async (label) => {
    const confirmed = window.confirm(
      `Delete "${label.name}" label?`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/labels/${label.id}`,
        {
          method: 'DELETE',
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {}
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Could not delete label.'
        );
      }

      setAvailableLabels((prev) =>
        prev.filter((item) => item.id !== label.id)
      );

      setLabels((prev) =>
        prev.filter((item) => item.id !== label.id)
      );
    } catch (error) {
      alert(error.message);
    }
  };

  // ------------------------------------------------------------
  // Comments
  // ------------------------------------------------------------
  const handleAddComment = (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    const comment = {
      id: `c-${Date.now()}`,
      user: user?.initials || 'You',
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleSaveAll}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header">
          <input
            type="text"
            className="modal-title-input"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          <button
            className="modal-close-btn"
            onClick={handleSaveAll}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-middle-section">
          {/* LEFT: DESCRIPTION + ASSOCIATE TASK */}
          <div className="modal-area-description">
            {/* DESCRIPTION */}
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div className="section-title">
                <AlignLeft size={16} />
                <span>Description</span>
              </div>

              <textarea
                className="modal-textarea"
                placeholder="Add a detailed description..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>
          </div>

          <div className="modal-area-associate">
            {/* ASSOCIATE TASK - REPLACES CHECKLIST */}
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div
                className="section-title"
                style={{
                  justifyContent:
                    'space-between'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Link size={16} />
                  <span>
                    Associate Task ({progressPercent}%)
                  </span>
                </div>
              </div>

              {checklist.length > 0 && (
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${progressPercent}%`
                    }}
                  />
                </div>
              )}

              {checklist.map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', width: '100%' }}>
                  <div
                    className="checklist-item"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() =>
                          toggleChecklist(item.id)
                        }
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />

                      <span
                        className={`checklist-item-text${
                          item.completed
                            ? ' completed'
                            : ''
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleChecklistDesc(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: item.description ? '#3b82f6' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: item.description ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                      title={item.description ? 'Edit Description (exists)' : 'Add Description'}
                    >
                      <FileText size={14} />
                    </button>
                  </div>

                  {activeDescChecklistId === item.id && (
                    <div className="inline-desc-editor" style={{
                      padding: '8px 12px',
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '100%'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        Description for {item.text}
                      </div>
                      <textarea
                        className="modal-textarea"
                        style={{ minHeight: '60px', padding: '6px', fontSize: '12px' }}
                        value={editingDescText}
                        onChange={(e) => setEditingDescText(e.target.value)}
                        placeholder="Add description about this task..."
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-create"
                          style={{ padding: '4px 10px', fontSize: '11px', height: '24px' }}
                          onClick={() => handleSaveChecklistDesc(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="side-btn"
                          style={{ padding: '4px 10px', fontSize: '11px', height: '24px' }}
                          onClick={() => {
                            setActiveDescChecklistId(null);
                            setEditingDescText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <form
                onSubmit={handleAddChecklist}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                <input
                  type="text"
                  className="modal-mini-input"
                  placeholder="Add task association..."
                  value={newChecklistItem}
                  onChange={(e) =>
                    setNewChecklistItem(
                      e.target.value
                    )
                  }
                  style={{ flex: 1 }}
                />

                <button
                  type="submit"
                  className="btn-create"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px'
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: LABELS + TYPE OF WORK */}
          <div className="modal-area-labels">
            {/* LABELS */}
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={16} />
                  <span>Labels</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowManageLabels(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Manage & Select Labels"
                    className="label-action-btn"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLabels}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Clear Labels"
                    className="label-action-btn"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                {/* SELECTED LABEL CHIPS */}
                {labels.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    {labels.map((label) => (
                      <span
                        key={label.id}
                        className="label-pill"
                        style={{
                          backgroundColor: label.color,
                          color: getContrastColor(label.color),
                          opacity: 1,
                          padding: '4px 9px'
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-area-type">
            {/* TYPE OF WORK */}
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div className="section-title">
                <Briefcase size={16} />
                <span>Type of Work</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '8px',
                  background: 'var(--bg-muted)',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleUpdateTypeOfWork('task')}
                  className={`work-type-btn task ${typeOfWork === 'task' ? 'active' : ''}`}
                >
                  <span className={`work-type-dot task ${typeOfWork === 'task' ? 'active' : ''}`} />
                  Task
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateTypeOfWork('subtask')}
                  className={`work-type-btn subtask ${typeOfWork === 'subtask' ? 'active' : ''}`}
                >
                  <span className={`work-type-dot subtask ${typeOfWork === 'subtask' ? 'active' : ''}`} />
                  Subtask
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateTypeOfWork('bug')}
                  className={`work-type-btn bug ${typeOfWork === 'bug' ? 'active' : ''}`}
                >
                  <span className={`work-type-dot bug ${typeOfWork === 'bug' ? 'active' : ''}`} />
                  Bug
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <hr className="modal-layout-divider" />

        {/* BOTTOM SECTION: SUBTASKS + ACTIONS */}
        <div className="modal-bottom-section">
          {/* LEFT: SUBTASKS */}
          <div className="modal-area-subtasks">
            {/* SUBTASKS */}
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div className="subtasks-header">
                <div className="subtasks-header-title">
                  <CheckSquare size={16} />
                  <span>Subtasks</span>
                </div>
                <button
                  type="button"
                  className="subtask-add-btn-icon"
                  onClick={() => setShowAddSubtask(!showAddSubtask)}
                  title="Add Subtask"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Subtasks Progress Bar & Percentage */}
              {subtasks.length > 0 && (
                <>
                  <div className="subtask-progress-bar-container">
                    {subtasks.filter(s => s.status === 'done').length > 0 && (
                      <div
                        className="subtask-progress-bar-done"
                        style={{
                          width: `${(subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100}%`
                        }}
                      />
                    )}
                    {subtasks.filter(s => s.status === 'in_progress').length > 0 && (
                      <div
                        className="subtask-progress-bar-in-progress"
                        style={{
                          width: `${(subtasks.filter(s => s.status === 'in_progress').length / subtasks.length) * 100}%`
                        }}
                      />
                    )}
                    {subtasks.filter(s => s.status === 'todo').length > 0 && (
                      <div
                        className="subtask-progress-bar-todo"
                        style={{
                          width: `${(subtasks.filter(s => s.status === 'todo').length / subtasks.length) * 100}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="subtask-percentage-text">
                    {Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100)}% Done
                  </div>
                </>
              )}

              {/* Add Subtask Form */}
              {showAddSubtask && (
                <form
                  onSubmit={handleAddSubtask}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <input
                    type="text"
                    className="modal-mini-input"
                    placeholder="Subtask name"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-create"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Add
                  </button>
                </form>
              )}

              {/* List of Subtasks */}
              <div className="subtasks-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {subtasks.map((sub) => (
                  <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', width: '100%' }}>
                    <div className={`subtask-item ${sub.status}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                      {/* Checkbox Icon */}
                      {sub.status === 'done' ? (
                        <CheckSquare
                          size={16}
                          style={{ color: '#10b981', cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => handleToggleSubtaskCheckbox(sub)}
                        />
                      ) : sub.status === 'in_progress' ? (
                        <Square
                          size={16}
                          style={{ color: '#0284c7', cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => handleToggleSubtaskCheckbox(sub)}
                        />
                      ) : (
                        <Square
                          size={16}
                          style={{ color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => handleToggleSubtaskCheckbox(sub)}
                        />
                      )}

                      {/* Editable Text */}
                      {editingSubtaskId === sub.id ? (
                        <input
                          type="text"
                          className="subtask-text-input"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onBlur={() => handleSaveSubtaskTitle(sub.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSubtaskTitle(sub.id);
                            } else if (e.key === 'Escape') {
                              setEditingSubtaskId(null);
                            }
                          }}
                          autoFocus
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <span
                          className={`subtask-text-span ${sub.status === 'done' ? 'done' : ''}`}
                          onClick={() => handleStartEditSubtask(sub)}
                          style={{ flex: 1 }}
                        >
                          {sub.title}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleSubtaskDesc(sub)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: sub.description ? '#8b5cf6' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: sub.description ? 1 : 0.6,
                          transition: 'all 0.2s',
                          marginRight: '4px',
                          flexShrink: 0
                        }}
                        title={sub.description ? 'Edit Description (exists)' : 'Add Description'}
                      >
                        <FileText size={14} />
                      </button>

                      {/* Status Dropdown */}
                      <select
                        className="subtask-status-select"
                        value={sub.status}
                        onChange={(e) => handleUpdateSubtaskStatus(sub.id, e.target.value)}
                        style={{ flexShrink: 0 }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="subtask-delete-btn"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        title="Delete Subtask"
                        style={{ flexShrink: 0 }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    {activeDescSubtaskId === sub.id && (
                      <div className="inline-desc-editor" style={{
                        padding: '8px 12px',
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        marginTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          Description for {sub.title}
                        </div>
                        <textarea
                          className="modal-textarea"
                          style={{ minHeight: '60px', padding: '6px', fontSize: '12px' }}
                          value={editingDescText}
                          onChange={(e) => setEditingDescText(e.target.value)}
                          placeholder="Add subtask description..."
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-create"
                            style={{ padding: '4px 10px', fontSize: '11px', height: '24px' }}
                            onClick={() => handleSaveSubtaskDesc(sub.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="side-btn"
                            style={{ padding: '4px 10px', fontSize: '11px', height: '24px' }}
                            onClick={() => {
                              setActiveDescSubtaskId(null);
                              setEditingDescText('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="modal-area-actions">
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              ACTIONS
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* MOVE */}
              <div className="side-btn">
                <Move size={14} />

                <select
                  value={targetListId}
                  onChange={(e) =>
                    setTargetListId(
                      e.target.value
                    )
                  }
                  className="modal-select"
                >
                  {lists.map((l) => (
                    <option
                      key={l.id}
                      value={l.id}
                    >
                      List: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* DUE DATE */}
              <div
                className="side-btn"
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Calendar size={14} />
                  <span>Due Date</span>
                </div>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  className="modal-mini-input"
                  style={{
                    padding: '4px 6px',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* DELETE */}
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
      </div>

      {/* =========================================================
          CREATE LABEL MODAL
      ========================================================== */}
      {showAddLabel && (
        <div
          className="confirm-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background:
              'rgba(15,23,42,.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() =>
            setShowAddLabel(false)
          }
        >
          <div
            className="manage-labels-modal"
            style={{
              width: '360px',
              borderRadius: '12px',
              padding: '22px'
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3
              className="manage-labels-title"
              style={{
                margin: '0 0 18px'
              }}
            >
              Create Label
            </h3>

            <label
              className="manage-labels-label"
              style={{
                display: 'block',
                fontSize: '12px',
                marginBottom: '6px'
              }}
            >
              Label Name
            </label>

            <input
              className="modal-mini-input"
              value={newLabelName}
              onChange={(e) =>
                setNewLabelName(
                  e.target.value
                )
              }
              placeholder="e.g. UI Testing"
              autoFocus
            />

            <label
              className="manage-labels-label"
              style={{
                display: 'block',
                fontSize: '12px',
                margin:
                  '14px 0 6px'
              }}
            >
              Color
            </label>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
              {PRESET_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setNewLabelColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: newLabelColor === c ? '2px solid white' : '2px solid transparent',
                    boxShadow: newLabelColor === c ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {newLabelColor === c && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                </div>
              ))}
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '6px' }}>
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #334155',
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none',
                    overflow: 'hidden'
                  }}
                />
                <span className="manage-labels-label" style={{ fontSize: '11px', marginLeft: '6px' }}>Custom</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: '8px',
                marginTop: '20px'
              }}
            >
              <button
                className="side-btn"
                onClick={() =>
                  setShowAddLabel(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-create"
                onClick={createLabel}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MANAGE LABELS
      ========================================================== */}
      {showManageLabels && (
        <div
          className="confirm-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background:
              'rgba(15,23,42,.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() =>
            setShowManageLabels(false)
          }
        >
          <div
            className="manage-labels-modal"
            style={{
              width: '430px',
              maxWidth: '92vw',
              maxHeight: '75vh',
              overflowY: 'auto',
              borderRadius: '12px',
              padding: '22px'
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                marginBottom: '15px'
              }}
            >
              <h3
                className="manage-labels-title"
                style={{
                  margin: 0
                }}
              >
                Manage Labels
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-create"
                  onClick={() => {
                    setShowManageLabels(false);
                    setShowAddLabel(true);
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '28px'
                  }}
                >
                  <Plus size={12} /> Add Label
                </button>

                <button
                  className="modal-close-btn"
                  onClick={() =>
                    setShowManageLabels(false)
                  }
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {availableLabels.map(
              (label) => (
                <div
                  key={label.id}
                  className="manage-labels-item"
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    padding: '10px 0'
                  }}
                >
                  {editingLabelId ===
                  label.id ? (
                    <>
                      <input
                        value={
                          editingLabelName
                        }
                        onChange={(e) =>
                          setEditingLabelName(
                            e.target.value
                          )
                        }
                        className="modal-mini-input"
                        style={{
                          flex: 1
                        }}
                      />

                      <input
                        type="color"
                        value={editingLabelColor}
                        onChange={(e) =>
                          setEditingLabelColor(e.target.value)
                        }
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: '2px solid #334155',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'none',
                          overflow: 'hidden'
                        }}
                      />

                      <button
                        className="btn-create"
                        onClick={() =>
                          saveEditedLabel(
                            label.id
                          )
                        }
                      >
                        Save
                      </button>

                      <button
                        className="side-btn"
                        onClick={
                          cancelEditLabel
                        }
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {labels.some((l) => l.id === label.id) ? (
                        <CheckSquare
                          size={16}
                          style={{
                            color: label.color,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          onClick={() => toggleLabel(label)}
                        />
                      ) : (
                        <Square
                          size={16}
                          style={{
                            color: '#64748b',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          onClick={() => toggleLabel(label)}
                        />
                      )}

                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius:
                            '50%',
                          backgroundColor:
                            label.color,
                          flexShrink: 0
                        }}
                      />

                      <span
                        className="label-item-name"
                        style={{
                          flex: 1,
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleLabel(label)}
                      >
                        {label.name}
                      </span>



                      <button
                        className="side-btn"
                        onClick={() =>
                          startEditLabel(
                            label
                          )
                        }
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        className="side-btn danger"
                        onClick={() =>
                          deleteLabel(
                            label
                          )
                        }
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}