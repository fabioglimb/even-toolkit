/**
 * STT Debug logging — enabled via window.__sttDebug = true
 * or by calling enableSTTDebug() from the console.
 *
 * All logs are also stored in window.__sttLogs[] for inspection.
 */

const MAX_LOGS = 200;

export function sttLog(...args: any[]): void {
  const w = window as any;
  if (!w.__sttLogs) w.__sttLogs = [];

  const entry = {
    t: new Date().toISOString().slice(11, 23),
    msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
  };

  w.__sttLogs.push(entry);
  if (w.__sttLogs.length > MAX_LOGS) w.__sttLogs.shift();

  if (w.__sttDebug) {
    console.log(`[STT ${entry.t}]`, ...args);
  }
}

/** Call from browser console: enableSTTDebug() */
(window as any).enableSTTDebug = () => {
  (window as any).__sttDebug = true;
  console.log('[STT] Debug enabled. Logs:', (window as any).__sttLogs);
};

/** Call from browser console: getSTTLogs() */
(window as any).getSTTLogs = () => {
  return ((window as any).__sttLogs ?? [])
    .map((e: any) => `${e.t} ${e.msg}`)
    .join('\n');
};
