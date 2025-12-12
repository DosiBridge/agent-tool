/**
 * Scroll behavior helpers
 * Following Refactoring.Guru: Extract Method, Extract Variable
 */

import * as constants from "./constants";

export interface ScrollState {
  isUserScrolling: boolean;
  showScrollButton: boolean;
  lastContentLength: number;
  lastMessageCount: number;
}

/**
 * Calculates distance from bottom of scroll container
 */
export function calculateDistanceFromBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  return scrollHeight - scrollTop - clientHeight;
}

/**
 * Checks if user is near bottom of scroll container
 */
export function isNearBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold: number = constants.AUTO_SCROLL_THRESHOLD_PX
): boolean {
  const distanceFromBottom = calculateDistanceFromBottom(
    scrollTop,
    scrollHeight,
    clientHeight
  );
  return distanceFromBottom < threshold;
}

/**
 * Determines if auto-scroll should occur
 */
export function shouldAutoScroll(
  isUserScrolling: boolean,
  isNewMessage: boolean,
  isStreaming: boolean,
  isContentUpdate: boolean,
  isNearBottom: boolean
): boolean {
  return (
    !isUserScrolling &&
    (isNewMessage || (isStreaming && isContentUpdate) || isNearBottom)
  );
}

/**
 * Gets scroll behavior based on streaming state
 */
export function getScrollBehavior(isStreaming: boolean): ScrollBehavior {
  return isStreaming ? "smooth" : "auto";
}

/**
 * Gets scroll delay based on streaming state
 */
export function getScrollDelay(isStreaming: boolean): number {
  return isStreaming ? constants.STREAMING_SCROLL_DELAY_MS : 0;
}

