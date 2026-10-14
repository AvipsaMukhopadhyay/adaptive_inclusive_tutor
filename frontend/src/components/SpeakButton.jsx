// Read-aloud support using the browser's built-in speech synthesis.
export default function SpeakButton({ text, label = 'Listen' }) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return null
  const speak = () => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }
  return (
    <button type="button" className="btn-speak" onClick={speak} aria-label={`${label}: read aloud`}>
      🔊 {label}
    </button>
  )
}
