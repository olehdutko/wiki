import { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { createPortal } from 'react-dom';

interface ImagePreviewCellProps {
    imageUrl: string | null;
    previewSize?: number;
}

export function ImagePreviewCell({ imageUrl, previewSize = 50 }: ImagePreviewCellProps) {
    const [showPreview, setShowPreview] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const portalRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);

    const clearHideTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimeout();
        timeoutRef.current = setTimeout(() => {
            setShowPreview(false);
        }, 250);
    }, [clearHideTimeout]);

    const handleEnter = useCallback(() => {
        clearHideTimeout();
        setShowPreview(true);
    }, [clearHideTimeout]);

    useEffect(() => {
        const thumb = thumbRef.current;
        const portal = portalRef.current;
        if (!thumb) return;

        thumb.addEventListener('mouseenter', handleEnter);
        thumb.addEventListener('mouseleave', scheduleHide);

        if (portal) {
            portal.addEventListener('mouseenter', handleEnter);
            portal.addEventListener('mouseleave', scheduleHide);
        }

        return () => {
            thumb.removeEventListener('mouseenter', handleEnter);
            thumb.removeEventListener('mouseleave', scheduleHide);
            if (portal) {
                portal.removeEventListener('mouseenter', handleEnter);
                portal.removeEventListener('mouseleave', scheduleHide);
            }
            clearHideTimeout();
        };
    }, [handleEnter, scheduleHide]);

    if (!imageUrl) {
        return <span>-</span>;
    }

    return (
        <Box
            ref={thumbRef}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%'
            }}
        >
            <img
                src={imageUrl}
                alt=""
                style={{
                    width: previewSize,
                    height: previewSize,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'block'
                }}
            />
            {showPreview && createPortal(
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <Box
                        ref={portalRef}
                        sx={{
                            width: 420,
                            height: 420,
                            backgroundColor: 'rgba(15, 23, 42, 0.25)',
                            borderRadius: 3,
                            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt=""
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: 2,
                                display: 'block',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                            }}
                        />
                    </Box>
                </Box>,
                document.body
            )}
        </Box>
    );
}
