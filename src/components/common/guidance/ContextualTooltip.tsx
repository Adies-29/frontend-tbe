import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface ContextualTooltipProps {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    maxWidth?: number;
}

export default function ContextualTooltip({
    content,
    position = 'top',
    maxWidth = 280,
}: ContextualTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Tutup tooltip ketika klik di luar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setIsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const positionClasses: Record<string, string> = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses: Record<string, string> = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    };

    return (
        <span className="relative inline-flex items-center">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-gray-400 hover:text-blue-500 transition-colors cursor-help ml-1"
                aria-label="Informasi tambahan"
            >
                <Info size={14} />
            </button>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{ maxWidth: `${maxWidth}px` }}
                    className={`
                        absolute z-50 ${positionClasses[position]}
                        px-3 py-2 rounded-lg
                        bg-gray-800 text-white text-xs leading-relaxed
                        shadow-lg
                        animate-in fade-in zoom-in-95 duration-150
                    `}
                >
                    {content}
                    {/* Arrow */}
                    <span
                        className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
                    />
                </div>
            )}
        </span>
    );
}
