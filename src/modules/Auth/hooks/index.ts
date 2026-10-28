import { useCallback, useEffect, useState } from 'react'
import { clearSession, fetchMe, readSession, syncTimeZone, writeSession } from '../services'
import type { Session } from '../types'

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const stored = readSession()
    if (!stored) {
      setIsChecking(false)
      return
    }

    let listening = true
    fetchMe(stored.token).then(async (user) => {
      if (!listening) return
      if (!user) {
        clearSession()
        setSession(null)
      } else {
        const next = await syncTimeZone({ token: stored.token, user })
        if (!listening) return
        writeSession(next)
        setSession(next)
      }
      setIsChecking(false)
    })

    return () => {
      listening = false
    }
  }, [])

  const signIn = useCallback((next: Session) => {
    writeSession(next)
    setSession(next)
    // The zone follows in the background; the calendar reads it from the session.
    syncTimeZone(next).then((synced) => {
      if (synced === next) return
      writeSession(synced)
      setSession(synced)
    })
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return { session, isChecking, signIn, signOut }
}
