import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface HoverTooltipProps {
  children: ReactNode;
  content: ReactNode;
  delayMs?: number;
  className?: string;
}

export function HoverTooltip({ 
  children, 
  content, 
  delayMs = 2000, // Default 2 seconds
  className = ''
}: HoverTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (event: React.MouseEvent) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Calculate position based on mouse and element
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setPosition({ x: centerX, y: centerY });

    // Set timeout to show tooltip after delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before delay
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Add a small delay before hiding to allow mouse to move to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100); // 100ms delay to allow mouse transition to tooltip
  };

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const tooltipPortal = isVisible && typeof window !== 'undefined' 
    ? createPortal(
        <>
          {/* Dark overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 opacity-100"
            onClick={() => setIsVisible(false)}
          />
          
          {/* Tooltip content */}
          <div 
            className={`fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-6 max-w-md w-80 transition-all duration-300 opacity-100 ${className}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => {
              // Keep tooltip visible when hovering over tooltip content
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
              }
              setIsVisible(true); // Ensure tooltip stays visible
            }}
            onMouseLeave={() => {
              // Hide tooltip when leaving tooltip content
              setIsVisible(false);
            }}
          >
            {content}
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        {children}
      </div>
      {tooltipPortal}
    </>
  );
}