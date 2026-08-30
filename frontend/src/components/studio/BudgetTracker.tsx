import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { FurnitureItem } from '../../types/studio';

interface BudgetTrackerProps {
  currentSpend: number;
  budgetLimit: number;
  items: FurnitureItem[];
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  currentSpend,
  budgetLimit,
  items,
}) => {
  const [displayedSpend, setDisplayedSpend] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const spendRef = useRef({ val: 0 });

  const percentage = Math.min(Math.round((currentSpend / budgetLimit) * 100), 100);
  const remaining = Math.max(budgetLimit - currentSpend, 0);

  // Animated width/value tween (~500–800ms per increment, power2.out easing)
  useEffect(() => {
    // Tween numerical value
    gsap.to(spendRef.current, {
      val: currentSpend,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayedSpend(Math.round(spendRef.current.val));
      },
    });

    // Tween progress bar width
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${percentage}%`,
        duration: 0.7,
        ease: 'power2.out',
      });
    }
  }, [currentSpend, budgetLimit, percentage]);

  return (
    <div className="budget-tracker-card">
      <div className="budget-top-row">
        <div className="budget-stat-block">
          <div className="budget-label-wrap">
            <DollarSign size={15} />
            <span className="budget-label">COMMITTED SPEND</span>
          </div>
          <span className="budget-number-large">${displayedSpend.toLocaleString()}</span>
        </div>

        <div className="budget-stat-block align-right">
          <div className="budget-label-wrap">
            <ShieldCheck size={15} />
            <span className="budget-label">REMAINING CEILING</span>
          </div>
          <span className="budget-number-remaining">${remaining.toLocaleString()}</span>
        </div>
      </div>

      {/* Animated Fill Bar */}
      <div className="budget-meter-track">
        <div 
          ref={progressBarRef} 
          className="budget-meter-fill"
          style={{ width: `${(displayedSpend / budgetLimit) * 100}%` }}
        >
          <span className="budget-meter-shine" />
        </div>
      </div>

      <div className="budget-bottom-meta">
        <div className="budget-cap-badge">
          <span>Hard Cap: ${budgetLimit.toLocaleString()}</span>
        </div>
        <div className="budget-utilization">
          <span>{percentage}% Utilized ({items.length} assets)</span>
        </div>
      </div>
    </div>
  );
};
