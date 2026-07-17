/**
 * Reserved integration point for future ad units (e.g. AdSense).
 * Renders nothing in v1 so the layout is already stable when ads arrive.
 */
export function AdSlot(_props: { slot: 'list' | 'detail' }) {
  return null;
}
