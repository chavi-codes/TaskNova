import React, { useEffect, useState } from 'react';
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
  Trash
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_LABELS = [
  { id: 'task', name: 'Task', color: '#3b82f6', system: true },
  { id: 'subtask', name: 'Subtask', color: '#8b5cf6', system: true },
  { id: 'bug', name: 'Bug', color: '#ef4444', system: true }
];

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
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [pendingChecklist, setPendingChecklist] = useState(null);

  const [subtasks, setSubtasks] = useState(card.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPercent = checklist.length
    ? Math.round((completedCount / checklist.length) * 100)
    : 0;

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
  const handleSaveAll = () => {
    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist,
      labels,
      comments,
      subtasks
    });

    if (targetListId !== listId) {
      onMoveCard(card.id, listId, targetListId);
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

    const isNowAllCompleted =
      updated.length > 0 &&
      updated.every((item) => item.completed);

    const wasAllCompletedBefore =
      checklist.length > 0 &&
      checklist.every((item) => item.completed);

    if (isNowAllCompleted && !wasAllCompletedBefore) {
      const currentList = lists.find((l) => l.id === listId);
      const isDoneList =
        currentList?.title?.toLowerCase() === 'done';

      if (!isDoneList) {
        const doneList = lists.find(
          (l) => l.title?.toLowerCase() === 'done'
        );

        if (doneList) {
          if (autoMoveSetting) {
            await onUpdateCard(card.id, {
              title,
              description,
              dueDate,
              checklist: updated,
              labels,
              comments
            });

            await onMoveCard(
              card.id,
              listId,
              doneList.id
            );

            onClose();
          } else {
            setPendingChecklist(updated);
            setShowMoveConfirm(true);
          }
        }
      }
    }
  };  const handleConfirmMove = () => {
    const doneList = lists.find(
      (l) => l.title?.toLowerCase() === 'done'
    );

    if (doneList) {
      onUpdateCard(card.id, {
        title,
        description,
        dueDate,
        checklist: pendingChecklist || checklist,
        labels,
        comments,
        subtasks
      });

      onMoveCard(card.id, listId, doneList.id);
      onClose();
    }

    setShowMoveConfirm(false);
    setPendingChecklist(null);
  };

  const handleCancelMove = () => {
    const updatedChecklist =
      pendingChecklist || checklist;

    onUpdateCard(card.id, {
      title,
      description,
      dueDate,
      checklist: updatedChecklist,
      labels,
      comments,
      subtasks
    });

    setShowMoveConfirm(false);
    setPendingChecklist(null);
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
      subtasks
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
      subtasks: updated
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
      subtasks: updated
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
      subtasks: updated
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
      subtasks: updated
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
    if (label.system) {
      alert(
        'Task, Subtask and Bug are default labels and cannot be deleted.'
      );
      return;
    }

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

        <div className="modal-grid">
          <div className="modal-left">

            {/* =====================================================
                LABELS + SUBTASKS SIDE BY SIDE
            ====================================================== */}
            <div className="modal-row-side-by-side">
              {/* LEFT: LABELS */}
              <div className="modal-section-half">
                <div className="section-title">
                  <Tag size={16} />
                  <span>Labels</span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    marginTop: '10px'
                  }}
                >
                  <button
                    type="button"
                    className="modal-select"
                    onClick={() =>
                      setLabelsOpen(!labelsOpen)
                    }
                    style={{
                      width: '100%',
                      minHeight: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span>
                      {labels.length > 0
                        ? `${labels.length} label${
                            labels.length > 1
                              ? 's'
                              : ''
                          } selected`
                        : 'Select labels'}
                    </span>

                    <span>▼</span>
                  </button>

                  {/* SELECTED LABEL CHIPS */}
                  {labels.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px'
                      }}
                    >
                      {labels.map((label) => (
                        <span
                          key={label.id}
                          className="label-pill"
                          style={{
                            backgroundColor: label.color,
                            opacity: 1,
                            padding: '4px 9px'
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* DROPDOWN */}
                {labelsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '44px',
                      left: 0,
                      minWidth: '200px',
                      width: '100%',
                      zIndex: 50,
                      background: '#111827',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '8px',
                      boxShadow:
                        '0 18px 40px rgba(0,0,0,.45)'
                    }}
                  >
                    <div
                      style={{
                        maxHeight: '190px',
                        overflowY: 'auto'
                      }}
                    >
                      {availableLabels.map(
                        (label) => {
                          const active =
                            labels.some(
                              (item) =>
                                item.id === label.id
                            );

                          return (
                            <div
                              key={label.id}
                              role="button"
                              onClick={() => {
                                toggleLabel(label);
                                setLabelsOpen(false);
                              }}
                              className={`labels-dropdown-item ${active ? 'active' : ''}`}
                            >
                              <span
                                style={{
                                  width: '9px',
                                  height: '9px',
                                  borderRadius:
                                    '50%',
                                  backgroundColor:
                                    label.color,
                                  flexShrink: 0
                                }}
                              />

                              <span
                                style={{
                                  flex: 1
                                }}
                              >
                                {label.name}
                              </span>

                              {active && (
                                <span>
                                  ✓
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}

                      {availableLabels.length ===
                        0 && (
                        <div
                          style={{
                            padding: '12px',
                            color: '#94a3b8',
                            fontSize: '12px',
                            textAlign: 'center'
                          }}
                        >
                          No labels found
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        borderTop:
                          '1px solid #334155',
                        marginTop: '7px',
                        paddingTop: '7px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setLabelsOpen(false);
                          setShowAddLabel(true);
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background:
                            'transparent',
                          color: '#cbd5e1',
                          padding: '8px',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} /> Add label
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLabelsOpen(false);
                          setShowManageLabels(
                            true
                          );
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background:
                            'transparent',
                          color: '#cbd5e1',
                          padding: '8px',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <Settings size={14} /> Manage
                        labels
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: SUBTASKS */}
            <div className="modal-section-half">
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
              <div className="subtasks-list">
                {subtasks.map((sub) => (
                  <div key={sub.id} className={`subtask-item ${sub.status}`}>
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
                      />
                    ) : (
                      <span
                        className={`subtask-text-span ${sub.status === 'done' ? 'done' : ''}`}
                        onClick={() => handleStartEditSubtask(sub)}
                      >
                        {sub.title}
                      </span>
                    )}

                    {/* Status Dropdown */}
                    <select
                      className="subtask-status-select"
                      value={sub.status}
                      onChange={(e) => handleUpdateSubtaskStatus(sub.id, e.target.value)}
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
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

            {/* DESCRIPTION */}
            <div className="modal-section">
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

            {/* CHECKLIST - EXISTING FEATURE */}
            <div className="modal-section">
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
                  <CheckSquare size={16} />
                  <span>
                    Checklist ({progressPercent}%)
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
                <div
                  key={item.id}
                  className="checklist-item"
                >
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
                  placeholder="Add item..."
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

            {/* Comments removed to save space */}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="modal-sidebar-btns">
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#94a3b8'
              }}
            >
              ACTIONS
            </span>

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
            style={{
              width: '360px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '22px'
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <h3
              style={{
                margin: '0 0 18px',
                color: '#fff'
              }}
            >
              Create Label
            </h3>

            <label
              style={{
                display: 'block',
                color: '#94a3b8',
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
              style={{
                display: 'block',
                color: '#94a3b8',
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
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>Custom</span>
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
            style={{
              width: '430px',
              maxWidth: '92vw',
              maxHeight: '75vh',
              overflowY: 'auto',
              background: '#1e293b',
              border: '1px solid #334155',
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
                style={{
                  margin: 0,
                  color: '#fff'
                }}
              >
                Manage Labels
              </h3>

              <button
                className="modal-close-btn"
                onClick={() =>
                  setShowManageLabels(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            {availableLabels.map(
              (label) => (
                <div
                  key={label.id}
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    padding: '10px 0',
                    borderBottom:
                      '1px solid #334155'
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
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius:
                            '50%',
                          backgroundColor:
                            label.color
                        }}
                      />

                      <span
                        style={{
                          flex: 1,
                          color: '#e2e8f0'
                        }}
                      >
                        {label.name}
                      </span>

                      {label.system && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#64748b'
                          }}
                        >
                          Default
                        </span>
                      )}

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

      {/* =========================================================
          CHECKLIST MOVE CONFIRMATION
      ========================================================== */}
      {showMoveConfirm && (
        <div
          className="confirm-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor:
              'rgba(15, 23, 42, 0.85)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            className="confirm-dialog"
            style={{
              backgroundColor: '#1e293b',
              border:
                '1px solid #334155',
              borderRadius: '12px',
              padding: '28px',
              width: '340px',
              textAlign: 'center',
              boxShadow:
                '0 20px 25px -5px rgba(0,0,0,.5)'
            }}
          >
            <h3
              style={{
                color: '#ffffff',
                marginBottom: '10px',
                fontSize: '18px'
              }}
            >
              Checklist completed!
            </h3>

            <p
              style={{
                color: '#94a3b8',
                marginBottom: '24px',
                fontSize: '14px'
              }}
            >
              Move this task to Done?
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent:
                  'center'
              }}
            >
              <button
                onClick={
                  handleConfirmMove
                }
                style={{
                  backgroundColor:
                    '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Move
              </button>

              <button
                onClick={
                  handleCancelMove
                }
                style={{
                  backgroundColor:
                    '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Keep Here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}