import React, { useState } from 'react';
import { LayoutGrid, Columns3, StickyNote, Move, Users, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function buildSteps(name) {
  return [
    {
      icon: <PartyPopper size={22} />,
      title: `Welcome, ${name}!`,
      body: 'Your account has been created successfully. Here\u2019s a 60-second tour of how boards work.'
    },
    {
      icon: <LayoutGrid size={22} />,
      title: 'Create a board',
      body: 'Your board is your workspace. Give it a name at the top and it\u2019s ready for lists right away.'
    },
    {
      icon: <Columns3 size={22} />,
      title: 'Add lists',
      body: 'Use "Add another list" to create stages like To Do, In Progress, and Done.'
    },
    {
      icon: <StickyNote size={22} />,
      title: 'Create cards',
      body: 'Inside any list, choose "Add a card" to capture a task, idea, or to-do.'
    },
    {
      icon: <Move size={22} />,
      title: 'Drag and drop',
      body: 'Click and hold a card, then drop it into another list to move work forward.'
    },
    {
      icon: <Users size={22} />,
      title: 'Invite your team',
      body: 'Bring teammates onto your board from Profile Settings to collaborate in real time.'
    }
  ];
}

export default function OnboardingTour({ onFinish }) {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const steps = buildSteps(user?.name?.split(' ')[0] || 'there');
  const isLast = step === steps.length - 1;

  const finish = () => {
    completeOnboarding();
    onFinish();
  };

  const current = steps[step];

  return (
    <div className="auth-modal-overlay">
      <div className="onboarding-modal" role="dialog" aria-modal="true">
        <div className="onboarding-icon">{current.icon}</div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={finish}>Skip</button>
          <div className="onboarding-nav-btns">
            {step > 0 && (
              <button className="onboarding-btn ghost" onClick={() => setStep((s) => s - 1)}>Previous</button>
            )}
            {isLast ? (
              <button className="onboarding-btn primary" onClick={finish}>Finish</button>
            ) : (
              <button className="onboarding-btn primary" onClick={() => setStep((s) => s + 1)}>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
