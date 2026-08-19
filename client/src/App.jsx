import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InboxView from './components/InboxView';
import BoardView from './components/BoardView';
import PlannerView from './components/PlannerView';
import SprintBacklogView from './components/SprintBacklogView';
import NavigationSidebar from './components/NavigationSidebar';
import CardModal from './components/CardModal';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import OnboardingTour from './components/OnboardingTour';
import { useAuth } from './context/AuthContext';
import { LayoutGrid, Sparkles } from 'lucide-react';

const EMPTY_BOARD = { title: '', lists: [] };

export default function App() {
  const { isAuthenticated, isFirstSession, token } = useAuth();

  const [board, setBoard] = useState(EMPTY_BOARD);
  const [activeView, setActiveView] = useState('board'); // 'board' | 'planner' | 'sprint' | 'inbox'
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState(null);
  const [activeCardListId, setActiveCardListId] = useState(null);

  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsNavExpanded(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch board data only once the user is authenticated (protects dashboard data).
  // Re-fetches whenever the token changes, so switching accounts always pulls
  // that account's own board instead of reusing whatever was in state before.
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBoardData();
    } else {
      // No authenticated session — make sure no previous user's board lingers.
      setBoard(EMPTY_BOARD);
      setActiveCard(null);
      setActiveCardListId(null);
      setSearchQuery('');
    }
  }, [isAuthenticated, token]);

  // Launch the onboarding tour the first time an authenticated session needs it
  useEffect(() => {
    if (isAuthenticated && isFirstSession) setShowOnboarding(true);
  }, [isAuthenticated, isFirstSession]);

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${token}`,
    ...extra
  });

  const fetchBoardData = async () => {
    try {
      const res = await fetch('/api/board', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
      }
    } catch (err) {
      console.error('Failed to load board data:', err);
    }
  };

  // Add List
  const handleAddList = async (title, color) => {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title, color })
      });
      if (res.ok) {
        const newList = await res.json();
        setBoard((prev) => ({
          ...prev,
          lists: [...prev.lists, newList]
        }));
      }
    } catch (err) {
      console.error('Error adding list:', err);
    }
  };

  // Delete List
  const handleDeleteList = async (listId) => {
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.filter((l) => l.id !== listId)
        }));
      }
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  // Add Card
  const handleAddCard = async (listId, title) => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ listId, title })
      });
      if (res.ok) {
        const newCard = await res.json();
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) =>
            l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
          )
        }));
      }
    } catch (err) {
      console.error('Error adding card:', err);
    }
  };

  // Update Card
  const handleUpdateCard = async (cardId, updates) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedCard = await res.json();
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => ({
            ...l,
            cards: l.cards.map((c) => (c.id === cardId ? updatedCard : c))
          }))
        }));
        // Update activeCard to stay in sync with the backend response
        setActiveCard((prev) => (prev && prev.id === cardId ? updatedCard : prev));
      }
    } catch (err) {
      console.error('Error updating card:', err);
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => ({
            ...l,
            cards: l.cards.filter((c) => c.id !== cardId)
          }))
        }));
      }
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  // Move Card between lists
  const handleMoveCard = async (cardId, sourceListId, targetListId) => {
    try {
      const res = await fetch('/api/cards/move', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ cardId, sourceListId, targetListId })
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
        if (activeCard && activeCard.id === cardId) {
          setActiveCardListId(targetListId);
          const targetList = data.board.lists.find((l) => l.id === targetListId);
          const freshCard = targetList?.cards?.find((c) => c.id === cardId);
          if (freshCard) {
            setActiveCard(freshCard);
          }
        }
      }
    } catch (err) {
      console.error('Error moving card:', err);
    }
  };

  const handleUpdateBoard = async (newBoardData) => {
    try {
      const res = await fetch('/api/board', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newBoardData)
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
      }
    } catch (err) {
      console.error('Error updating board:', err);
    }
  };

  const inboxList = board.lists.find((l) => l.isInbox) || { id: 'list-inbox', cards: [] };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--sprint-page-bg)' }}>
      {isAuthenticated && (
        <NavigationSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
          onSwitchBoards={() => alert('Switch board feature: You are currently viewing "My Board"!')}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddCardClick={() => {
            const firstBoardList = board.lists.find((l) => !l.isInbox);
            if (firstBoardList) {
              const title = prompt('Enter card title:');
              if (title) handleAddCard(firstBoardList.id, title);
            }
          }}
          onOpenLogin={() => setAuthModal('login')}
          onOpenSignup={() => setAuthModal('signup')}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {isAuthenticated ? (
          <>
            {/* Board Title Bar */}
            <div className="board-bar">
              <div className="board-title">
                <span>{board.title}</span>
              </div>
            </div>

            {/* Main Workspace Layout */}
            <div className="main-container">
              {/* Workspace View (Inbox, Board, Planner or Sprint Backlog) */}
              {activeView === 'inbox' ? (
                <InboxView
                  inboxList={inboxList}
                  onCardClick={(card, listId) => {
                    setActiveCard(card);
                    setActiveCardListId(listId);
                  }}
                  onAddInboxCard={(title) => handleAddCard(inboxList.id, title)}
                />
              ) : activeView === 'board' ? (
                <BoardView
                  lists={board.lists}
                  searchQuery={searchQuery}
                  onCardClick={(card, listId) => {
                    setActiveCard(card);
                    setActiveCardListId(listId);
                  }}
                  onAddCard={handleAddCard}
                  onAddList={handleAddList}
                  onDeleteList={handleDeleteList}
                  onMoveCard={handleMoveCard}
                />
              ) : activeView === 'planner' ? (
                <PlannerView
                  lists={board.lists}
                  onCardClick={(card, listId) => {
                    setActiveCard(card);
                    setActiveCardListId(listId);
                  }}
                />
              ) : (
                <SprintBacklogView
                  board={board}
                  lists={board.lists}
                  searchQuery={searchQuery}
                  onCardClick={(card, listId) => {
                    setActiveCard(card);
                    setActiveCardListId(listId);
                  }}
                  onUpdateCard={handleUpdateCard}
                  onMoveCard={handleMoveCard}
                  onUpdateBoard={handleUpdateBoard}
                />
              )}
            </div>

            {/* Card Details Modal */}
            {activeCard && (
              <CardModal
                card={activeCard}
                listId={activeCardListId}
                lists={board.lists}
                onClose={() => setActiveCard(null)}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onMoveCard={handleMoveCard}
              />
            )}

            {showOnboarding && (
              <OnboardingTour onFinish={() => setShowOnboarding(false)} />
            )}
          </>
        ) : (
          <div className="gate-screen">
            <div className="gate-card">
              <div className="gate-icon"><LayoutGrid size={26} /></div>
              <h1>Organize work, your way</h1>
              <p>Log in or create a free account to open your boards, lists, and cards.</p>
              <div className="gate-actions">
                <button className="auth-submit-btn" onClick={() => setAuthModal('signup')}>
                  <Sparkles size={16} />
                  <span>Get started free</span>
                </button>
                <button className="gate-login-btn" onClick={() => setAuthModal('login')}>
                  I already have an account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToSignup={() => setAuthModal('signup')}
        />
      )}
      {authModal === 'signup' && (
        <SignupModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </div>
  );
}
