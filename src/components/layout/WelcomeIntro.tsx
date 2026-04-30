'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const TYPING_WORD = 'DOWN BELOW'
const TYPING_SPEED_MS = 85
const INTRO_DURATION_MS = 3400

export default function WelcomeIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem('dbwd-intro-seen') !== '1'
  })
  const [typedLength, setTypedLength] = useState(0)

  const typedWord = useMemo(() => TYPING_WORD.slice(0, typedLength), [typedLength])

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return
    window.sessionStorage.setItem('dbwd-intro-seen', '1')

    return undefined
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const typingTimer = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= TYPING_WORD.length) {
          window.clearInterval(typingTimer)
          return prev
        }
        return prev + 1
      })
    }, TYPING_SPEED_MS)

    return () => {
      window.clearInterval(typingTimer)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return

    const hideTimer = window.setTimeout(() => {
      setVisible(false)
    }, INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(hideTimer)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="welcome-intro"
          className="fixed inset-0 z-[120] flex items-center justify-center px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          style={{
            background:
              'radial-gradient(circle at 15% 15%, rgba(252,238,33,0.18), rgba(11,78,65,0) 38%), radial-gradient(circle at 88% 84%, rgba(255,255,255,0.14), rgba(11,78,65,0) 34%), #0B4E41',
          }}
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-center text-white"
          >
            <p className="font-body tracking-[0.14em] uppercase text-xs sm:text-sm mb-4" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Welcome to
            </p>
            <h1 className="font-body font-bold tracking-[0.08em] text-3xl sm:text-5xl md:text-6xl min-h-[1.2em]">
              {typedWord}
              <span className="inline-block w-[0.08em] h-[1em] ml-1 align-[-0.08em]" style={{ backgroundColor: 'var(--color-accent)' }} />
            </h1>
            <div className="mt-5 inline-flex flex-col items-center">
              <p className="font-heading text-2xl sm:text-3xl md:text-4xl">With Dr. Didi</p>
              <motion.span
                className="mt-2 block h-[2px] rounded-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
