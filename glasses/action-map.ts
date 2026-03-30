import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { GlassAction } from './types';
import { tryConsumeTap, shouldIgnoreScroll } from './gestures';

export function mapGlassEvent(event: EvenHubEvent): GlassAction | null {
  if (!event) return null;
  try {
    const ev = event.listEvent ?? event.textEvent ?? event.sysEvent;
    if (!ev) return null;
    return mapEvent(ev);
  } catch {
    return null;
  }
}

function mapEvent(event: { eventType?: number; currentSelectItemIndex?: number }): GlassAction | null {
  const et = event.eventType;
  switch (et) {
    case OsEventTypeList.CLICK_EVENT:
      if (!tryConsumeTap('tap')) return null;
      return { type: 'SELECT_HIGHLIGHTED' };
    case OsEventTypeList.DOUBLE_CLICK_EVENT:
      if (!tryConsumeTap('double')) return null;
      return { type: 'GO_BACK' };
    case OsEventTypeList.SCROLL_TOP_EVENT:
      if (shouldIgnoreScroll('prev')) return null;
      return { type: 'HIGHLIGHT_MOVE', direction: 'up' };
    case OsEventTypeList.SCROLL_BOTTOM_EVENT:
      if (shouldIgnoreScroll('next')) return null;
      return { type: 'HIGHLIGHT_MOVE', direction: 'down' };
    default:
      // Simulator omits eventType for CLICK_EVENT (value 0).
      // Catch: currentSelectItemIndex present, or eventType missing entirely.
      if (et == null || (event.currentSelectItemIndex != null && (et as number) === 0)) {
        if (!tryConsumeTap('tap')) return null;
        return { type: 'SELECT_HIGHLIGHTED' };
      }
      return null;
  }
}
