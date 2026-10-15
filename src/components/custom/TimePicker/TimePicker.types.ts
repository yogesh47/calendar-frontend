/* Time types — the canonical value is a 24-hour "HH:mm" string. */

export interface TimeParts {
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
}

export type Period = 'AM' | 'PM';

export type TimeFormat = '12h' | '24h';

export type TimePickerSize = 'sm' | 'md' | 'lg';

export interface TimePickerProps {
  /** Selected time as a canonical 24-hour `"HH:mm"` string. */
  value?: string;
  /** Fired with the newly selected canonical `"HH:mm"` string. */
  onChange?: (value: string) => void;
  /** Display format for the trigger and columns. */
  format?: TimeFormat;
  /** Minute increment shown in the minutes column. */
  minuteStep?: number;
  placeholder?: string;
  size?: TimePickerSize;
  disabled?: boolean;
  /** Highlight the field border on hover. */
  hover?: boolean;
  /** Field label rendered above the trigger. */
  label?: string;
  /** Helper text rendered below the trigger. */
  hint?: string;
  /** Error message; puts the field in an invalid state. */
  error?: string;
  className?: string;
  /** Accessible label when no visible `label` is provided. */
  'aria-label'?: string;
}
