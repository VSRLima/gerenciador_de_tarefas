import { Dispatch, SetStateAction, useEffect } from 'react';

export const useAutoDismissMessage = (
  message: string | null,
  clearMessage: Dispatch<SetStateAction<string | null>>,
  delay = 4000,
): void => {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearMessage(null);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearMessage, delay, message]);
};
