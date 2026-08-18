import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Play, 
  CheckCircle2, 
  MoreVertical,
  CheckSquare,
  Square,
  Eye,
  EyeOff
} from 'lucide-react';

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

export default function SprintBacklogView({
  board,
  lists,
  searchQuery,
  onCardClick,
  onUpdateCard,
  onMoveCard,
  onUpdateBoard
}) {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('task');
  const [editListId, setEditListId] = useState('');
  const [activeMenuSprintId, setActiveMenuSprintId] = useState(null);
  const [deleteConfirmSprint, setDeleteConfirmSprint] = useState(null);
  const [showHiddenSprintsDropdown, setShowHiddenSprintsDropdown] = useState(false);

  // Sprint Definitions
  const sprints = board.sprints || [
    {
      id: 'sprint-1',
      name: 'Sprint 1',
      startDate: '2026-07-06',
      endDate: '2026-07-11',
      description: 'Completing the Employee authentication process...',
      status: 'active'
    }
  ];

  // Helper: Find which list a card belongs to
  const getCardList = (cardId) => {
    const list = lists.find(l => l.cards.some(c => c.id === cardId));
    return list || { id: '', title: '' };
  };

  // Helper: Get Card Status based on List Title
  const getCardStatus = (cardId) => {
    const listTitle = getCardList(cardId).title.toLowerCase();
    if (listTitle.includes('done')) return 'done';
    if (listTitle.includes('progress') || listTitle.includes('review')) return 'in_progress';
    return 'todo';
  };

  // Helper: Derive unique issue key
  const getIssueKey = (card) => {
    const prefix = card.typeOfWork ? card.typeOfWork.toUpperCase() : 'TASK';
    const shortId = card.id ? card.id.substring(card.id.length - 4).toUpperCase() : '0000';
    return `${prefix}-${shortId}`;
  };

  // Helper: Get assignee initials
  const getAssignee = (card) => {
    if (card.members && card.members.length > 0) {
      return card.members[0].toUpperCase();
    }
    return 'UN';
  };

  // Flatten all cards with listId references
  const allCards = lists.flatMap(l => 
    l.cards.map(c => ({ ...c, listId: l.id, listTitle: l.title }))
  );

  // Filter cards by search query
  const filteredCards = allCards.filter(card => {
    const query = searchQuery ? searchQuery.toLowerCase() : '';
    if (!query) return true;

    const issueKey = getIssueKey(card).toLowerCase();
    const titleMatch = card.title?.toLowerCase().includes(query);
    const idMatch = issueKey.includes(query);
    const descMatch = card.description?.toLowerCase().includes(query);
    const typeMatch = card.typeOfWork?.toLowerCase().includes(query);
    const labelMatch = card.labels?.some(l => l.name.toLowerCase().includes(query));
    const statusMatch = getCardList(card.id).title.toLowerCase().includes(query);
    
    return titleMatch || idMatch || descMatch || typeMatch || labelMatch || statusMatch;
  });

  // Sprint Creation
  const handleCreateSprint = () => {
    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: `Sprint ${sprints.length + 1}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Focusing on backlog items and deliverables.',
      status: 'active'
    };
    onUpdateBoard({
      ...board,
      sprints: [...sprints, newSprint]
    });
  };

  // Sprint Completion
  const handleCompleteSprint = (sprintId) => {
    const updatedSprints = sprints.map(s => s.id === sprintId ? { ...s, status: 'completed' } : s);
    
    const updatedLists = lists.map(list => {
      const isDoneList = list.title.toLowerCase().includes('done');
      return {
        ...list,
        cards: list.cards.map(card => {
          if (card.sprintId === sprintId && !isDoneList) {
            // Move non-completed cards to backlog
            return { ...card, sprintId: null };
          }
          return card;
        })
      };
    });

    onUpdateBoard({
      ...board,
      lists: updatedLists,
      sprints: updatedSprints
    });
  };

  // Hide Sprint
  const handleHideSprint = (sprintId) => {
    const updatedSprints = sprints.map(s => s.id === sprintId ? { ...s, isHidden: true } : s);
    onUpdateBoard({
      ...board,
      sprints: updatedSprints
    });
    setActiveMenuSprintId(null);
  };

  // Show Sprint
  const handleShowSprint = (sprintId) => {
    const updatedSprints = sprints.map(s => s.id === sprintId ? { ...s, isHidden: false } : s);
    onUpdateBoard({
      ...board,
      sprints: updatedSprints
    });
  };

  // Delete Sprint
  const handleDeleteSprint = (sprintId) => {
    const updatedSprints = sprints.filter(s => s.id !== sprintId);
    const updatedLists = lists.map(list => ({
      ...list,
      cards: list.cards.map(card => {
        if (card.sprintId === sprintId) {
          return { ...card, sprintId: null };
        }
        return card;
      })
    }));

    onUpdateBoard({
      ...board,
      lists: updatedLists,
      sprints: updatedSprints
    });
    setDeleteConfirmSprint(null);
  };

  // Move Card between sprints/backlog
  const handleMoveToSprint = (cardId, targetSprintId) => {
    const updatedLists = lists.map(list => ({
      ...list,
      cards: list.cards.map(card => {
        if (card.id === cardId) {
          return { ...card, sprintId: targetSprintId };
        }
        return card;
      })
    }));

    onUpdateBoard({
      ...board,
      lists: updatedLists
    });
  };

  // Status Change from dropdown
  const handleStatusChange = (cardId, newStatus) => {
    const currentList = getCardList(cardId);
    let targetList = lists.find(l => {
      const title = l.title.toLowerCase();
      if (newStatus === 'done') return title.includes('done');
      if (newStatus === 'in_progress') return title.includes('progress') || title.includes('review');
      return title.includes('todo') || l.isInbox;
    });

    if (!targetList) {
      if (newStatus === 'done') targetList = lists[lists.length - 1];
      else if (newStatus === 'in_progress') targetList = lists[Math.floor(lists.length / 2)];
      else targetList = lists[0];
    }

    onMoveCard(cardId, currentList.id, targetList.id);
  };

  // Fast inline edit save
  const handleInlineSave = async (cardId) => {
    const currentList = getCardList(cardId);
    await onUpdateCard(cardId, {
      title: editTitle,
      description: editDesc,
      typeOfWork: editType
    });

    if (editListId && editListId !== currentList.id) {
      await onMoveCard(cardId, currentList.id, editListId);
    }

    setEditingCardId(null);
  };

  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditTitle(card.title || '');
    setEditDesc(card.description || '');
    setEditType(card.typeOfWork || 'task');
    setEditListId(getCardList(card.id).id);
  };

  const toggleAccordion = (cardId) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  // Quick Card Creation
  const handleCreateWorkItem = (sprintId) => {
    const title = prompt('Enter work item title:');
    if (!title) return;

    // Find first list to add card into (Inbox or Todo)
    const firstList = lists.find(l => !l.isInbox) || lists[0];
    if (firstList) {
      // Add card and immediately set its sprintId
      const newCardId = `card-${Date.now()}`;
      const newCard = {
        id: newCardId,
        title,
        description: '',
        labels: [],
        dueDate: '',
        checklist: [],
        comments: [],
        subtasks: [],
        typeOfWork: 'task',
        sprintId
      };

      const updatedLists = lists.map(l => {
        if (l.id === firstList.id) {
          return { ...l, cards: [...l.cards, newCard] };
        }
        return l;
      });

      onUpdateBoard({
        ...board,
        lists: updatedLists
      });
    }
  };

  return (
    <div className="sprint-backlog-view">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={24} style={{ color: 'var(--ln-primary)' }} />
            Sprint Backlog View
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Plan, monitor sprints, and expand work items inline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          {/* Hidden Sprints Toggle */}
          <button
            onClick={() => setShowHiddenSprintsDropdown(!showHiddenSprintsDropdown)}
            className="side-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', border: '1px solid var(--ln-border)' }}
          >
            <Eye size={16} />
            Hidden Sprints ({sprints.filter(s => s.isHidden).length})
          </button>

          {/* Hidden Sprints Dropdown content */}
          {showHiddenSprintsDropdown && (
            <div style={{
              position: 'absolute',
              top: '42px',
              right: '125px',
              background: 'var(--ln-card)',
              border: '1px solid var(--ln-border)',
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              zIndex: 100,
              minWidth: '220px',
              padding: '8px 0'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', padding: '6px 12px', borderBottom: '1px solid var(--ln-border)', color: 'var(--text-muted)' }}>
                HIDDEN SPRINTS
              </div>
              {sprints.filter(s => s.isHidden).length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  No hidden sprints
                </div>
              ) : (
                sprints.filter(s => s.isHidden).map(s => (
                  <div key={s.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    fontSize: '13px',
                    gap: '10px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <span style={{ fontWeight: '600' }}>{s.name}</span>
                    <button
                      onClick={() => handleShowSprint(s.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ln-primary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Show Sprint"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <button
            onClick={handleCreateSprint}
            className="btn-create"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
          >
            <Plus size={16} />
            Create Sprint
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE/OPEN SPRINTS */}
      {sprints.filter(s => s.status !== 'completed' && !s.isHidden).map((sprint) => {
        const sprintCards = filteredCards.filter(c => c.sprintId === sprint.id);
        const todoCount = sprintCards.filter(c => getCardStatus(c.id) === 'todo').length;
        const progressCount = sprintCards.filter(c => getCardStatus(c.id) === 'in_progress').length;
        const doneCount = sprintCards.filter(c => getCardStatus(c.id) === 'done').length;
        const totalCount = sprintCards.length;

        const donePercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        return (
          <div key={sprint.id} className="sprint-container" style={{
            background: 'var(--ln-card)',
            border: '1px solid var(--ln-border)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            {/* SPRINT HEADER */}
            <div className="sprint-header" style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '1px solid var(--ln-border)',
              paddingBottom: '12px',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{sprint.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {sprint.startDate} – {sprint.endDate}
                  </span>
                  <span className="card-badge" style={{ fontSize: '11px', background: 'var(--bg-muted)' }}>
                    {totalCount} work items
                  </span>
                </div>
                {sprint.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                    {sprint.description}
                  </p>
                )}
              </div>

              {/* Progress Summary & Completion controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 6px', background: '#e2e8f0', color: '#475569', borderRadius: '4px', fontWeight: 'bold' }}>
                    {todoCount} To Do
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', background: '#bae6fd', color: '#0369a1', borderRadius: '4px', fontWeight: 'bold' }}>
                    {progressCount} In Progress
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', background: '#d1fae5', color: '#047857', borderRadius: '4px', fontWeight: 'bold' }}>
                    {doneCount} Done
                  </span>
                </div>

                <div style={{ width: '120px', background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${donePercent}%`, background: '#10b981', height: '100%' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{donePercent}%</span>

                <button
                  onClick={() => handleCompleteSprint(sprint.id)}
                  className="btn-create"
                  style={{ background: 'var(--success)', borderColor: 'var(--success)', padding: '4px 10px', fontSize: '12px', height: '28px' }}
                >
                  Complete Sprint
                </button>

                {/* 3-dot options menu */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setActiveMenuSprintId(activeMenuSprintId === sprint.id ? null : sprint.id)}
                    className="side-btn"
                    style={{
                      padding: '4px 8px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--ln-border)',
                      borderRadius: '4px'
                    }}
                    title="Sprint options"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuSprintId === sprint.id && (
                    <div style={{
                      position: 'absolute',
                      top: '32px',
                      right: '0',
                      background: 'var(--ln-card)',
                      border: '1px solid var(--ln-border)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: '150px',
                      padding: '6px 0'
                    }}>
                      <button
                        onClick={() => handleHideSprint(sprint.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          color: 'var(--ln-text)',
                          padding: '8px 12px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <EyeOff size={14} />
                        Hide Sprint
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmSprint(sprint);
                          setActiveMenuSprintId(null);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          padding: '8px 12px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Trash2 size={14} />
                        Delete Sprint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SPRINT WORK ITEM LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sprintCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--ln-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '13px', marginBottom: '8px' }}>No work items in this sprint</div>
                  <button
                    onClick={() => handleCreateWorkItem(sprint.id)}
                    className="btn-create"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    + Create work item
                  </button>
                </div>
              ) : (
                sprintCards.map((card) => renderWorkItemRow(card, sprint.id))
              )}
            </div>
          </div>
        );
      })}

      {/* BACKLOG SECTION */}
      <div className="backlog-container" style={{
        background: 'var(--ln-card)',
        border: '1px solid var(--ln-border)',
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div className="sprint-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--ln-border)',
          paddingBottom: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Backlog</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Unscheduled work items needing prioritization.
            </p>
          </div>
          <span className="card-badge" style={{ background: 'var(--bg-muted)' }}>
            {filteredCards.filter(c => !c.sprintId).length} work items
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredCards.filter(c => !c.sprintId).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--ln-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>No work items in backlog</div>
              <button
                onClick={() => handleCreateWorkItem(null)}
                className="btn-create"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                + Create work item
              </button>
            </div>
          ) : (
            filteredCards.filter(c => !c.sprintId).map((card) => renderWorkItemRow(card, null))
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmSprint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--ln-card)',
            border: '1px solid var(--ln-border)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ln-text)' }}>
              Delete Sprint?
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              Are you sure you want to delete this sprint? <br />
              <strong style={{ color: 'var(--ln-text)' }}>{deleteConfirmSprint.name}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmSprint(null)}
                className="side-btn"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSprint(deleteConfirmSprint.id)}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid #ef4444',
                  fontWeight: '600'
                }}
              >
                Delete Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

  // Renders a single row in the Sprint list
  function renderWorkItemRow(card, currentSprintId) {
    const isExpanded = expandedCardId === card.id;
    const isEditing = editingCardId === card.id;
    const issueKey = getIssueKey(card);
    const listInfo = getCardList(card.id);
    const status = getCardStatus(card.id);

    // Get subtask progress
    const subCount = card.subtasks ? card.subtasks.length : 0;
    const subDone = card.subtasks ? card.subtasks.filter(s => s.status === 'done').length : 0;

    // Get type color
    const getTypeColor = (type) => {
      if (type === 'bug') return '#ef4444';
      if (type === 'subtask') return '#8b5cf6';
      return '#3b82f6'; // task
    };

    return (
      <div key={card.id} className={`sprint-work-item-row ${status}`} style={{
        border: '1px solid var(--ln-border)',
        borderRadius: '6px',
        overflow: 'hidden',
        background: isExpanded ? 'var(--bg-secondary)' : 'var(--ln-card)',
        transition: 'all 0.2s'
      }}>
        {/* ROW HEADER CONTAINER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: 'pointer',
          flexWrap: 'wrap',
          gap: '10px'
        }} onClick={() => toggleAccordion(card.id)}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            {/* Type Indicator */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: '800',
              color: getTypeColor(card.typeOfWork),
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getTypeColor(card.typeOfWork)
              }} />
              {card.typeOfWork || 'task'}
            </span>



            {/* Title */}
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ln-text)' }}>
              {card.title}
            </span>

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {card.labels.map(l => (
                  <span key={l.id} style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: l.color,
                    color: getContrastColor(l.color),
                    fontWeight: 'bold'
                  }}>
                    {l.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE DETAILS AND CHEVRON */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Subtask count */}
            {subCount > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckSquare size={12} />
                {subDone}/{subCount}
              </span>
            )}

            {/* Due date */}
            {card.dueDate && (
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                📅 {card.dueDate}
              </span>
            )}

            {/* Status Dropdown inside row header */}
            <select
              value={status}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(card.id, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="subtask-status-select"
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                height: '24px',
                borderColor: status === 'done' ? '#10b981' : status === 'in_progress' ? '#3b82f6' : 'var(--ln-border)',
                background: status === 'done' ? '#d1fae5' : status === 'in_progress' ? '#dbeafe' : 'var(--bg-muted)',
                color: status === 'done' ? '#047857' : status === 'in_progress' ? '#1d4ed8' : 'var(--ln-text)'
              }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>



            {/* Chevron toggle */}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

        </div>

        {/* EXPANDED ACCORDION PANEL */}
        {isExpanded && (
          <div className="expanded-details-pane" style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--ln-border)',
            background: 'var(--ln-card)'
          }}>
            {isEditing ? (
              // EDIT PANEL INLINE
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="manage-labels-label" style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    className="modal-mini-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="manage-labels-label" style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Description</label>
                  <textarea
                    className="modal-textarea"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    style={{ width: '100%', minHeight: '80px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label className="manage-labels-label" style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Type of Work</label>
                    <select
                      className="modal-select"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="task">Task</option>
                      <option value="subtask">Subtask</option>
                      <option value="bug">Bug</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="manage-labels-label" style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Board Column / List</label>
                    <select
                      className="modal-select"
                      value={editListId}
                      onChange={(e) => setEditListId(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {lists.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    onClick={() => handleInlineSave(card.id)}
                    className="btn-create"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingCardId(null)}
                    className="side-btn"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // READ-ONLY INFO PANE WITH ACTIONS
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Meta properties header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px dashed var(--ln-border)'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>TYPE OF WORK</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>{card.typeOfWork || 'task'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>STATUS</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>{listInfo.title}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>DUE DATE</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: card.dueDate ? '#ef4444' : 'inherit' }}>
                      {card.dueDate || 'No due date'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>SPRINT PLAN</span>
                    <select
                      value={currentSprintId || ''}
                      onChange={(e) => handleMoveToSprint(card.id, e.target.value || null)}
                      className="subtask-status-select"
                      style={{ fontSize: '11px', height: '24px', minWidth: '100px' }}
                    >
                      <option value="">Move to Backlog</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Card Description */}
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</h5>
                  <p style={{
                    fontSize: '12.5px',
                    color: card.description ? 'var(--ln-text)' : 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '10px',
                    borderRadius: '6px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {card.description || 'No description provided.'}
                  </p>
                </div>

                {/* Checklist (Associated Tasks) */}
                {card.checklist && card.checklist.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Associated Tasks ({Math.round((card.checklist.filter(i => i.completed).length / card.checklist.length) * 100)}% Done)
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {card.checklist.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.completed ? <CheckCircle2 size={14} style={{ color: '#10b981' }} /> : <span style={{ width: '14px' }} />}
                          <span style={{
                            fontSize: '12px',
                            color: item.completed ? 'var(--text-muted)' : 'var(--ln-text)',
                            textDecoration: item.completed ? 'line-through' : 'none'
                          }}>
                            {item.text}
                          </span>
                          {item.description && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '6px' }}>
                              ({item.description})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtasks list and description */}
                {card.subtasks && card.subtasks.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Subtasks ({subDone}/{subCount} Completed)
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {card.subtasks.map((sub) => (
                        <div key={sub.id} style={{
                          padding: '6px 10px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--ln-border)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: sub.status === 'done' ? '#10b981' : sub.status === 'in_progress' ? '#3b82f6' : '#94a3b8'
                              }} />
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: sub.status === 'done' ? 'var(--text-muted)' : 'var(--ln-text)',
                                textDecoration: sub.status === 'done' ? 'line-through' : 'none'
                              }}>
                                {sub.title}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                                background: sub.status === 'done' ? '#d1fae5' : sub.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                                color: sub.status === 'done' ? '#047857' : sub.status === 'in_progress' ? '#1d4ed8' : '#475569'
                              }}>
                                {sub.status}
                              </span>
                            </div>
                            {sub.description && (
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '14px', fontStyle: 'italic' }}>
                                {sub.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Control buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleStartEdit(card)}
                    className="btn-create"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit size={12} /> Inline Edit
                  </button>

                  <button
                    onClick={() => onCardClick(card, card.listId)}
                    className="side-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={12} /> Open Card
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
