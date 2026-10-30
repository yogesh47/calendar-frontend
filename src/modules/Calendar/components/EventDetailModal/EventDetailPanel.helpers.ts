// Only the marks the description editor can make survive; everything else is unwrapped to its text.
const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'UL',
  'OL',
  'LI',
  'H1',
  'H2',
  'H3',
  'BLOCKQUOTE',
  'CODE',
  'PRE',
])

export const safeHtml = (value: string): string => {
  const holder = new DOMParser().parseFromString(value, 'text/html').body

  holder.querySelectorAll('*').forEach((node) => {
    if (!ALLOWED_TAGS.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes))
      return
    }

    Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name))
  })

  return holder.innerHTML
}

export const hasText = (value: string): boolean =>
  new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() !== ''
