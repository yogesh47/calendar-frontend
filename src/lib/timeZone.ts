/*
  Wall clocks and instants across time zones. The screen always works in the
  browser's own zone; these convert at the edge, when talking to the API.
*/

export type WallClock = { day: string; time: string }

// Old names browsers still report for the same zones — Chrome in India says
// "Asia/Calcutta". The API stores the current name; this keeps the two in step.
const ZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Dacca': 'Asia/Dhaka',
  'Asia/Thimbu': 'Asia/Thimphu',
  'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
  'Europe/Kiev': 'Europe/Kyiv',
  'Europe/Uzhgorod': 'Europe/Kyiv',
  'Europe/Zaporozhye': 'Europe/Kyiv',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Godthab': 'America/Nuuk',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'Africa/Asmera': 'Africa/Asmara',
  'Etc/UTC': 'UTC',
}

/** The current IANA name for a zone: "Asia/Calcutta" → "Asia/Kolkata". */
export const canonicalZone = (zone: string): string => ZONE_ALIASES[zone] ?? zone

/** Where this browser is, e.g. "Asia/Kolkata", "America/New_York". */
export const browserZone = (): string => canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')

const formatters = new Map<string, Intl.DateTimeFormat>()

const formatterFor = (zone: string): Intl.DateTimeFormat => {
  let formatter = formatters.get(zone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(zone, formatter)
  }

  return formatter
}

/** The date and time a clock in `zone` shows at this instant. */
export const wallClockIn = (moment: Date, zone: string): WallClock => {
  const parts = Object.fromEntries(formatterFor(zone).formatToParts(moment).map((part) => [part.type, part.value]))

  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// How far `zone` is ahead of UTC at this instant, in milliseconds.
const offsetAt = (moment: Date, zone: string): number => {
  const clock = wallClockIn(moment, zone)
  const seconds = moment.getTime() % 60000

  return Date.parse(`${clock.day}T${clock.time}:00Z`) + seconds - moment.getTime()
}

/** The instant a clock in `zone` reads this date and time. */
export const instantIn = (day: string, time: string, zone: string): Date => {
  const asUtc = Date.parse(`${day}T${time || '00:00'}:00Z`)
  // Twice, so a guess that lands on the other side of a DST change corrects itself.
  const first = asUtc - offsetAt(new Date(asUtc), zone)

  return new Date(asUtc - offsetAt(new Date(first), zone))
}

/** "IST", "AEDT", "GMT-4" — the zone's short name at that instant. */
export const zoneLabel = (moment: Date, zone: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
    .formatToParts(moment)
    .find((part) => part.type === 'timeZoneName')?.value ?? zone

/** Every zone this browser knows, for a picker. */
export const allZones = (): string[] => {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf

  return supported ? [...new Set(supported('timeZone').map(canonicalZone))] : [browserZone()]
}
