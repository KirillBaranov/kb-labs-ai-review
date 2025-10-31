/**
 * Analytics event types for AI Review CLI
 * Centralized constants to prevent typos and enable type safety
 */

/**
 * Event type prefixes by command
 */
export const ANALYTICS_PREFIX = {
  REVIEW: 'ai-review.review',
  BUILD_CONTEXT: 'ai-review.build-context',
  RENDER_MD: 'ai-review.render-md',
  RENDER_HTML: 'ai-review.render-html',
  INIT_PROFILE: 'ai-review.init-profile',
} as const;

/**
 * Event lifecycle suffixes
 */
export const ANALYTICS_SUFFIX = {
  STARTED: 'started',
  FINISHED: 'finished',
} as const;

/**
 * AI Review analytics event types
 */
export const ANALYTICS_EVENTS = {
  // Review events
  REVIEW_STARTED: `${ANALYTICS_PREFIX.REVIEW}.${ANALYTICS_SUFFIX.STARTED}`,
  REVIEW_FINISHED: `${ANALYTICS_PREFIX.REVIEW}.${ANALYTICS_SUFFIX.FINISHED}`,

  // Build context events
  BUILD_CONTEXT_STARTED: `${ANALYTICS_PREFIX.BUILD_CONTEXT}.${ANALYTICS_SUFFIX.STARTED}`,
  BUILD_CONTEXT_FINISHED: `${ANALYTICS_PREFIX.BUILD_CONTEXT}.${ANALYTICS_SUFFIX.FINISHED}`,

  // Render MD events
  RENDER_MD_STARTED: `${ANALYTICS_PREFIX.RENDER_MD}.${ANALYTICS_SUFFIX.STARTED}`,
  RENDER_MD_FINISHED: `${ANALYTICS_PREFIX.RENDER_MD}.${ANALYTICS_SUFFIX.FINISHED}`,

  // Render HTML events
  RENDER_HTML_STARTED: `${ANALYTICS_PREFIX.RENDER_HTML}.${ANALYTICS_SUFFIX.STARTED}`,
  RENDER_HTML_FINISHED: `${ANALYTICS_PREFIX.RENDER_HTML}.${ANALYTICS_SUFFIX.FINISHED}`,

  // Init profile events
  INIT_PROFILE_STARTED: `${ANALYTICS_PREFIX.INIT_PROFILE}.${ANALYTICS_SUFFIX.STARTED}`,
  INIT_PROFILE_FINISHED: `${ANALYTICS_PREFIX.INIT_PROFILE}.${ANALYTICS_SUFFIX.FINISHED}`,
} as const;

/**
 * Type helper for analytics event types
 */
export type AnalyticsEventType = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

/**
 * Actor configuration for AI Review analytics
 */
export const ANALYTICS_ACTOR = {
  type: 'agent' as const,
  id: 'ai-review-cli',
} as const;

