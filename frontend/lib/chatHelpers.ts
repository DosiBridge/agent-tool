/**
 * Chat helper functions
 * Following Refactoring.Guru: Extract Method, Extract Variable
 */

import { StreamChunk } from "./api";
import * as constants from "./constants";

/**
 * Validates if input can be sent
 */
export function canSendMessage(
  input: string,
  isLoading: boolean,
  isStreaming: boolean
): boolean {
  const hasContent = input.trim().length > 0;
  const withinLimit = input.length <= constants.MAX_INPUT_CHARS;
  const notProcessing = !isLoading && !isStreaming;

  return hasContent && withinLimit && notProcessing;
}

/**
 * Checks if input exceeds character limit
 */
export function exceedsCharLimit(input: string): boolean {
  return input.length > constants.MAX_INPUT_CHARS;
}

/**
 * Generates autocomplete suggestions based on input
 */
export function generateSuggestions(input: string): string[] {
  if (input.trim().length === 0 || input.trim().length >= constants.MAX_SUGGESTION_LENGTH) {
    return [];
  }

  const inputLower = input.toLowerCase();
  const matched = constants.COMMON_QUERY_PREFIXES
    .filter((q) => q.toLowerCase().startsWith(inputLower))
    .slice(0, constants.MAX_SUGGESTIONS_DISPLAY);

  return matched;
}

/**
 * Handles stream chunk processing
 */
export function processStreamChunk(
  chunk: StreamChunk,
  callbacks: {
    onError: (error: string) => void;
    onStatusChange: (status: string | null) => void;
    onToolUsed: (tool: string) => void;
    onContent: (content: string) => void;
    onComplete: (toolsUsed?: string[]) => void;
  }
): void {
  if (chunk.error) {
    callbacks.onError(chunk.error);
    return;
  }

  if (chunk.status) {
    const normalizedStatus = normalizeStatus(chunk.status);
    callbacks.onStatusChange(normalizedStatus);
  }

  if (chunk.tool) {
    callbacks.onToolUsed(chunk.tool);
  }

  if (chunk.chunk !== undefined && chunk.chunk !== null) {
    callbacks.onContent(chunk.chunk);
  }

  if (chunk.done) {
    callbacks.onComplete(chunk.tools_used);
  }
}

/**
 * Normalizes status values
 */
function normalizeStatus(status: string): string | null {
  const normalizedStatuses: Record<string, string> = {
    connected: "thinking",
    creating_agent: "thinking",
    agent_ready: "thinking",
  };

  return normalizedStatuses[status] || status;
}

/**
 * Calculates textarea height based on content
 */
export function calculateTextareaHeight(
  scrollHeight: number,
  minHeight: number = constants.TEXTAREA_MIN_HEIGHT,
  maxHeight: number = constants.TEXTAREA_MAX_HEIGHT
): number {
  return Math.min(Math.max(scrollHeight, minHeight), maxHeight);
}

