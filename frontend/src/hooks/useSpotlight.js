import { useCallback } from 'react'

/** Pointer handler that feeds the `.spotlight` hover highlight its cursor position. */
export function useSpotlight() {
  return useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])
}
