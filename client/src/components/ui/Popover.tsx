import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width?: string;
  align?: 'left' | 'right';
}

export const Popover: React.FC<PopoverProps> = ({ 
  trigger, 
  content, 
  isOpen, 
  onClose, 
  width = 'w-48',
  align = 'right'
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, bottom: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        bottom: window.innerHeight - rect.top,
        width: rect.width
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
          width: rect.width
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
    return 192; // default
  };

  const popoverWidth = getWidthPx();

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
          className={`fixed z-[9999] bg-[#1a1b22] border border-[#30363d] rounded-lg shadow-xl p-1 font-sans animate-apple-scale origin-top ${width}`}
          style={{
            // Render upwards if not enough space below, else downwards
            top: coords.top + 200 > window.innerHeight ? 'auto' : coords.top + 8,
            bottom: coords.top + 200 > window.innerHeight ? coords.bottom + 8 : 'auto',
            // Align left or right
            left: align === 'right' ? coords.left + coords.width - popoverWidth : coords.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
