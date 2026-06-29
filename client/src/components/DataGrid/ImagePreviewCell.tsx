import { useState, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { createPortal } from 'react-dom';

interface ImagePreviewCellProps {
    imageUrl: string | null;
    previewSize?: number;
}

export function ImagePreviewCell({ imageUrl, previewSize = 50 }: ImagePreviewCellProps) {
    const [showPreview, setShowPreview] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoveringRef = useRef(false);

    const clearHideTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimeout();
        timeoutRef.current = setTimeout(() => {
            if (!isHoveringRef.current) {
                setShowPreview(false);
            }
        }, 250);
    }, [clearHideTimeout]);

    const handleEnter = useCallback(() => {
        isHoveringRef.current = true;
        clearHideTimeout();
        setShowPreview(true);
    }, [clearHideTimeout]);

    const handleLeave = useCallback(() => {
        isHoveringRef.current = false;
        scheduleHide();
    }, [scheduleHide]);

    if (!imageUrl) {
        return <span>-</span>;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%'
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
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
                        onMouseEnter={handleEnter}
                        onMouseLeave={handleLeave}
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
