import React, { useState, useEffect, useRef } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
  visible: boolean;
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    placement: 'top',
    visible: false,
  });

  const hideTimeoutRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        '[title], [data-tooltip]'
      ) as HTMLElement | null;

      if (!target) {
        return;
      }

      // If element has a native title attribute, steal it so browser tooltip never triggers
      if (target.hasAttribute('title')) {
        const rawTitle = target.getAttribute('title') || '';
        if (rawTitle.trim()) {
          target.setAttribute('data-tooltip', rawTitle);
        }
        target.removeAttribute('title');
      }

      const text = target.getAttribute('data-tooltip');
      if (!text || !text.trim()) {
        return;
      }

      currentTargetRef.current = target;

      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
      }

      // Small hover delay for natural feel
      showTimeoutRef.current = window.setTimeout(() => {
        if (!currentTargetRef.current) return;
        const rect = currentTargetRef.current.getBoundingClientRect();
        
        // Decide placement: top by default, bottom if near top edge of window
        const placement = rect.top < 40 ? 'bottom' : 'top';
        const x = rect.left + rect.width / 2;
        const y = placement === 'top' ? rect.top - 8 : rect.bottom + 8;

        setTooltip({
          text,
          x,
          y,
          placement,
          visible: true,
        });
      }, 100);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (
        currentTargetRef.current &&
        related &&
        currentTargetRef.current.contains(related)
      ) {
        return;
      }

      currentTargetRef.current = null;

      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    const handleDismiss = () => {
      currentTargetRef.current = null;
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleDismiss, true);
    document.addEventListener('scroll', handleDismiss, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleDismiss, true);
      document.removeEventListener('scroll', handleDismiss, true);
      if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      className="fixed pointer-events-none z-[99999] transition-opacity duration-150 animate-apple-fade"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform:
          tooltip.placement === 'top'
            ? 'translate(-50%, -100%)'
            : 'translate(-50%, 0)',
      }}
    >
      <div className="px-2.5 py-1 bg-[#1a1b22]/95 backdrop-blur-md text-zinc-100 text-[11px] font-medium rounded-lg border border-[#2e323e] shadow-xl whitespace-nowrap">
        {tooltip.text}
      </div>
    </div>
  );
};
