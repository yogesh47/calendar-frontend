import { useCallback, useEffect, useState } from 'react'
import { clearSession, fetchMe, readSession, writeSession } from '../services'
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
    fetchMe(stored.token).then((user) => {
      if (!listening) return
      if (!user) {
        clearSession()
        setSession(null)
      } else {
        const next = { token: stored.token, user }
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
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return { session, isChecking, signIn, signOut }
}
