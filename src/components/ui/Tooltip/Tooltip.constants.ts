/**
 * Dark tooltip bubble.
 *
 * `TooltipContent` now carries these colours itself, so every tooltip in the app is
 * dark and nothing needs to opt in. The constant is kept because callers pass it to
 * `HoverTooltip`'s `contentClassName`, where it is simply a no-op restatement.
 */
export const DARK_TOOLTIP =
  'border-transparent [background-color:var(--ds-color-tooltip-bg)] [color:var(--ds-color-tooltip-fg)]'
