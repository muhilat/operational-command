/**
 * Card State Logic
 * 
 * Semantic dimming without optical blur.
 * Philosophy: Use opacity and desaturation, never blur.
 * 
 * Consolidated Status: All degraded data confidence states map to AMBER.
 */

export type CardState = 'ACTIVE' | 'SECONDARY' | 'AMBER';

export interface CardStateConfig {
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  opacity: number;
  showSyncBadge: boolean;
  boxShadow?: string; // For AMBER glow effect
}

/**
 * Determine card state based on calibration and data freshness
 * All degraded confidence states map to AMBER
 */
export function getCardState(
  isInScope: boolean,
  isSelectedFocus: boolean,
  isCriticalSignal: boolean,
  lastSync: Date | null,
  staleThresholdHours: number = 4
): CardState {
  // Never mute if it's the selected focus or a critical signal
  if (isSelectedFocus || isCriticalSignal) {
    return 'ACTIVE';
  }

  // Check if data is stale/degraded - map to AMBER
  if (lastSync) {
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync > staleThresholdHours) {
      return 'AMBER'; // Degraded data confidence
    }
  }

  // If not in scope, mark as secondary (reduced contrast, no blur/opacity)
  if (!isInScope) {
    return 'SECONDARY';
  }

  return 'ACTIVE';
}

/**
 * Get styling configuration for a card state
 * AMBER_STATE: Consolidated degraded data confidence style
 */
export function getCardStateStyles(state: CardState): CardStateConfig {
  switch (state) {
    case 'ACTIVE':
      return {
        textColor: '#FFFFFF', // White
        borderColor: '#334155', // Slate-700
        backgroundColor: '#020617', // Obsidian
        opacity: 1.0,
        showSyncBadge: false,
      };
    case 'SECONDARY':
      return {
        textColor: '#64748B', // Slate-500 (reduced contrast)
        borderColor: '#334155', // Slate-700
        backgroundColor: '#020617', // Solid obsidian (no opacity)
        opacity: 1.0, // No opacity reduction
        showSyncBadge: false,
      };
    case 'AMBER':
      return {
        textColor: '#fbbf24', // Amber-400 for readability
        borderColor: '#d97706', // Amber-600
        backgroundColor: '#0f172a', // Solid Slate-900
        opacity: 1.0,
        showSyncBadge: true,
        boxShadow: '0 0 0 2px rgba(217, 119, 6, 0.2)', // Subtle non-blurred outer glow
      };
  }
}

