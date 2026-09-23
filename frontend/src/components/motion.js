/** True when the user (or the calm-mode accommodation) asks for no motion. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  if (document.body.classList.contains('calm-mode')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Splits text into user-perceived characters so emoji animate as a whole. */
export function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
  }
  return Array.from(text)
}
