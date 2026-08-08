import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t bg-brand-navy dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="text-lg font-bold text-white">
              FeeFlow<span className="text-brand-gold">-360</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400">
              Simplifying school finance. Empowering education.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FeeFlow-360 by SharpbeeGh. All rights reserved.
        </div>
      </div>
    </footer>
  )
}