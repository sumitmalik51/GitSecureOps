import { useEffect } from 'react';

interface UseGlobalShortcutProps {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  enabled?: boolean;
}

const useGlobalShortcut = ({
  key,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false,
  altKey = false,
  callback,
  enabled = true
}: UseGlobalShortcutProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isTargetKey = event.key.toLowerCase() === key.toLowerCase();
      const isCtrlMatch = ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const isMetaMatch = metaKey ? event.metaKey : !event.metaKey;
      const isShiftMatch = shiftKey ? event.shiftKey : !event.shiftKey;
      const isAltMatch = altKey ? event.altKey : !event.altKey;

      // Check if the event is triggered from an input element
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      );

      // Only trigger if not in an input field (unless explicitly allowed)
      if (isTargetKey && isCtrlMatch && isMetaMatch && isShiftMatch && isAltMatch && !isInputActive) {
        event.preventDefault();
        event.stopPropagation();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrlKey, metaKey, shiftKey, altKey, callback, enabled]);
};

export default useGlobalShortcut;
