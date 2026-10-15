import type * as React from 'react';

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Async fetcher for server-driven option lists. Receives the current search
 * query (empty string on first open) and resolves the options to show. While
 * it is pending, the dropdown shows a loader.
 */
export type OptionFetcher = (query: string) => Promise<SelectOption[]> | SelectOption[];

export type Size = 'sm' | 'md' | 'lg';

export interface MultiSelectProps {
  options: SelectOption[];
  /** Rows rendered per page; the list grows on scroll. Default 50. */
  pageSize?: number;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  size?: Size;
  searchable?: boolean;
  /**
   * Chips shown before collapsing the rest into "+N".
   * A number is a fixed limit; `'auto'` (default) fits as many as the field
   * width allows.
   */
  maxChips?: number | 'auto';
  /**
   * Async option fetcher. When provided, typing in the search box calls it
   * (debounced) with a loader, then updates the options from what it returns.
   */
  onSearch?: OptionFetcher;
  disabled?: boolean;
  className?: string;
}

export interface ComboboxProps {
  options: SelectOption[];
  /** Rows rendered per page; the list grows on scroll. Default 50. */
  pageSize?: number;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: Size;
  searchable?: boolean;
  /**
   * Async option fetcher. When provided, typing in the search box calls it
   * (debounced) with a loader, then updates the options from what it returns.
   */
  onSearch?: OptionFetcher;
  disabled?: boolean;
  className?: string;
}
