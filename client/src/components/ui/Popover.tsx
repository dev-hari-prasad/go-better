import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Squircle } from '@squircle-js/react';

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width?: string;
  align?: 'left' | 'right';
  side?: 'bottom' | 'top' | 'right' | 'left';
}

export const Popover: React.FC<PopoverProps> = ({ 
  trigger, 
  content, 
  isOpen, 
  onClose, 
  width = 'w-48',
  align = 'right',
  side = 'bottom'
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    bottom: 0,
    width: 0,
    topRaw: 0,
    rightRaw: 0,
    heightRaw: 0
  });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        bottom: window.innerHeight - rect.top,
        width: rect.width,
        topRaw: rect.top,
        rightRaw: rect.right,
        heightRaw: rect.height,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom,
          left: rect.left,
          bottom: window.innerHeight - rect.top,
          width: rect.width,
          topRaw: rect.top,
          rightRaw: rect.right,
          heightRaw: rect.height,
        });
      }
    };
    
    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      onClose();
    };

    if (isOpen) {
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true); // true for capture phase to catch all scrolls
      
      // Delay adding click listener so the trigger click doesn't immediately close it
      setTimeout(() => {
        window.addEventListener('click', handleClickOutside);
      }, 0);
    }

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Determine width in pixels if width is a Tailwind class (rough mapping)
  const getWidthPx = () => {
    if (width === 'w-44') return 176;
    if (width === 'w-48') return 192;
    if (width === 'w-56') return 224;
    if (width === 'w-64') return 256;
    if (width === 'w-76') return 304;
    if (width === 'w-80') return 320;
    if (width === 'w-96') return 384;
    return 192; // default
  };

  const popoverWidth = getWidthPx();

  const getPositionStyles = (): React.CSSProperties => {
    if (side === 'right') {
      const hasRightSpace = coords.rightRaw + popoverWidth + 16 <= window.innerWidth;
      const left = hasRightSpace
        ? coords.rightRaw + 10
        : Math.max(16, coords.left - popoverWidth - 10);
      const top = Math.max(16, Math.min(window.innerHeight - 260, coords.topRaw - 4));
      return {
        top,
        left,
        bottom: 'auto',
        right: 'auto',
      };
    }

    if (side === 'left') {
      const hasLeftSpace = coords.left - popoverWidth - 16 >= 0;
      const left = hasLeftSpace
        ? coords.left - popoverWidth - 10
        : Math.min(window.innerWidth - popoverWidth - 16, coords.rightRaw + 10);
      const top = Math.max(16, Math.min(window.innerHeight - 260, coords.topRaw - 4));
      return {
        top,
        left,
        bottom: 'auto',
        right: 'auto',
      };
    }

    if (side === 'top') {
      return {
        top: 'auto',
        bottom: coords.bottom + 8,
        left: align === 'right' ? coords.left + coords.width - popoverWidth : coords.left,
      };
    }

    // Default 'bottom'
    return {
      top: coords.top + 200 > window.innerHeight ? 'auto' : coords.top + 8,
      bottom: coords.top + 200 > window.innerHeight ? coords.bottom + 8 : 'auto',
      left: align === 'right' ? coords.left + coords.width - popoverWidth : coords.left,
    };
  };

  return (
    <>
      <div 
        ref={triggerRef} 
        onClick={(e) => { 
          e.stopPropagation();
        }} 
        className="inline-block relative"
      >
        {trigger}
      </div>
      {isOpen && createPortal(
        <div 
          className={`fixed z-[9999] p-0 font-sans animate-apple-scale origin-top ${width}`}
          style={{
            ...getPositionStyles(),
            filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.65))',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Squircle
            cornerRadius={12}
            cornerSmoothing={1}
            defaultWidth={popoverWidth}
            className="w-full p-[1px] bg-[#30363d] overflow-hidden"
          >
            <Squircle
              cornerRadius={11}
              cornerSmoothing={1}
              defaultWidth={popoverWidth ? popoverWidth - 2 : undefined}
              className="w-full bg-[#1a1b22] p-1 overflow-hidden"
            >
              {content}
            </Squircle>
          </Squircle>
        </div>,
        document.body
      )}
    </>
  );
};
