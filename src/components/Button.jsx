export default function Button({ className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
  const styles = variant === 'secondary' ? 'border border-indigo-100 bg-white text-indigo-950 hover:bg-indigo-50' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
