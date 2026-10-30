import { createContext, useContext } from 'react'
import type { ComponentType, SVGProps } from 'react'
import {
  AlignLeft as LucideAlignLeft,
  Bell as LucideBell,
  BellPlus as LucideBellPlus,
  Calendar as LucideCalendar,
  CalendarDays as LucideCalendarDays,
  CalendarPlus as LucideCalendarPlus,
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Clock as LucideClock,
  Copy as LucideCopy,
  ExternalLink as LucideExternalLink,
  Info as LucideInfo,
  Link2 as LucideLink2,
  Lock as LucideLock,
  MapPin as LucideMapPin,
  Minus as LucideMinus,
  Plus as LucidePlus,
  RefreshCw as LucideRefreshCw,
  Repeat as LucideRepeat,
  Search as LucideSearch,
  StickyNote as LucideStickyNote,
  Tag as LucideTag,
  Trash2 as LucideTrash2,
  TriangleAlert as LucideTriangleAlert,
  Type as LucideType,
  Wand2 as LucideWand2,
  X as LucideX,
} from 'lucide-react'

/*
  Every icon the calendar draws, in one place. The defaults are lucide; an app
  on another icon set passes its own through <Calendar icons={{…}} />, one by
  one or all of them, and the calendar draws those instead.
*/
/** Plain SVG props — what every icon set's components accept. */
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref'>

export type IconComponent = ComponentType<IconProps>

export const DEFAULT_ICONS = {
  AlignLeft: LucideAlignLeft,
  Bell: LucideBell,
  BellPlus: LucideBellPlus,
  Calendar: LucideCalendar,
  CalendarDays: LucideCalendarDays,
  CalendarPlus: LucideCalendarPlus,
  Check: LucideCheck,
  ChevronDown: LucideChevronDown,
  ChevronLeft: LucideChevronLeft,
  ChevronRight: LucideChevronRight,
  Clock: LucideClock,
  Copy: LucideCopy,
  ExternalLink: LucideExternalLink,
  Info: LucideInfo,
  Link2: LucideLink2,
  Lock: LucideLock,
  MapPin: LucideMapPin,
  Minus: LucideMinus,
  Plus: LucidePlus,
  RefreshCw: LucideRefreshCw,
  Repeat: LucideRepeat,
  Search: LucideSearch,
  StickyNote: LucideStickyNote,
  Tag: LucideTag,
  Trash2: LucideTrash2,
  TriangleAlert: LucideTriangleAlert,
  Type: LucideType,
  Wand2: LucideWand2,
  X: LucideX,
} satisfies Record<string, IconComponent>

export type CalendarIconName = keyof typeof DEFAULT_ICONS

export type CalendarIcons = Record<CalendarIconName, IconComponent>

export const IconsContext = createContext<CalendarIcons>(DEFAULT_ICONS)

// A stand-in that draws whichever icon the app gave for this name.
const icon = (name: CalendarIconName) => {
  const Icon = (props: IconProps) => {
    const Drawn = useContext(IconsContext)[name]
    return <Drawn {...props} />
  }
  Icon.displayName = `CalendarIcon(${name})`
  return Icon
}

export const AlignLeft = icon('AlignLeft')
export const Bell = icon('Bell')
export const BellPlus = icon('BellPlus')
export const Calendar = icon('Calendar')
export const CalendarDays = icon('CalendarDays')
export const CalendarPlus = icon('CalendarPlus')
export const Check = icon('Check')
export const ChevronDown = icon('ChevronDown')
export const ChevronLeft = icon('ChevronLeft')
export const ChevronRight = icon('ChevronRight')
export const Clock = icon('Clock')
export const Copy = icon('Copy')
export const ExternalLink = icon('ExternalLink')
export const Info = icon('Info')
export const Link2 = icon('Link2')
export const Lock = icon('Lock')
export const MapPin = icon('MapPin')
export const Minus = icon('Minus')
export const Plus = icon('Plus')
export const RefreshCw = icon('RefreshCw')
export const Repeat = icon('Repeat')
export const Search = icon('Search')
export const StickyNote = icon('StickyNote')
export const Tag = icon('Tag')
export const Trash2 = icon('Trash2')
export const TriangleAlert = icon('TriangleAlert')
export const Type = icon('Type')
export const Wand2 = icon('Wand2')
export const X = icon('X')
