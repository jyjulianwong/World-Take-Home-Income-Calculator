import { useInView } from '../hooks/useInView'

export default function RevealOnScroll({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView()

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fly-in' : 'fly-in-hidden'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
