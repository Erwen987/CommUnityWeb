import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../supabaseClient';

const TIMEOUT_MS  = 10 * 60 * 1000; // 10 minutes
const WARNING_MS  = 60 * 1000;       // show warning 1 minute before logout

/**
 * Tracks user inactivity and:
 *   1. Shows a warning modal 1 minute before timeout
 *   2. Automatically logs out after 10 minutes of inactivity
 *   3. Resets the timer on any mouse/keyboard/touch activity
 *
 * Returns { showWarning, secondsLeft, resetTimer } so the host
 * component can render the warning UI and let the user cancel.
 */
function useSessionTimeout(enabled = true) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const logoutTimer  = useRef(null);
  const warningTimer = useRef(null);
  const countdownRef = useRef(null);

  const doLogout = useCallback(async () => {
    clearAll();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function clearAll() {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownRef.current);
  }

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearAll();
    setShowWarning(false);
    setSecondsLeft(60);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(60);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(countdownRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    logoutTimer.current = setTimeout(doLogout, TIMEOUT_MS);
  }, [enabled, doLogout]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearAll();
    };
  }, [enabled, resetTimer]);

  return { showWarning, secondsLeft, resetTimer };
}

export default useSessionTimeout;
