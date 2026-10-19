import { useEffect, useState } from 'react'

export const useIsMobile = (maxWidth = 767): boolean => {
  const query = `(max-width: ${maxWidth}px)`

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return isMobile
}

export default useIsMobile
