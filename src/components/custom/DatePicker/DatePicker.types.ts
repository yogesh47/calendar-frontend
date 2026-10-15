export interface DatePickerProps {
  /** DOM id of the trigger — a form focuses its first missing field by it. */
  id?: string;
  /** `YYYY-MM-DD`, the shape the API stores dates in. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  /** Draws the box in the error colour; the message itself belongs to the form. */
  hasError?: boolean;
  /** Earliest and latest selectable day, also `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  /** Dropdowns in the calendar's header, so a far-off year is two clicks away. */
  showMonthPicker?: boolean;
  showYearPicker?: boolean;
  yearRange?: { from: number; to: number };
  className?: string;
  'aria-label'?: string;
}
