import { Link } from 'react-router-dom'

export default function Logo() {
  return <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-indigo-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-base text-white shadow-lg shadow-violet-200">R</span>Resumate</Link>
}
