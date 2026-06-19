import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-zinc-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-zinc-300 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/parts" className="text-zinc-300 hover:text-white transition-colors">
                  Parts
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-zinc-300 hover:text-white transition-colors">
                  Offers
                </Link>
              </li>
              <li>
                <Link to="/test-drive" className="text-zinc-300 hover:text-white transition-colors">
                  Book Test Drive
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-300">Phone</p>
                  <p className="text-white">+977-1-XXXXXXX</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-300">Email</p>
                  <p className="text-white">info@suzukimotorcycle.com.np</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-300">Address</p>
                  <p className="text-white">Balkumari, Lalitpur, Nepal</p>
                </div>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">About Suzuki</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Suzuki is the oldest and most renowned biking brand in the world. We offer reliable,
              technologically sound, and trustworthy motorcycles and scooters in Nepal.
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 text-center">
          <p className="text-zinc-400 text-sm">
            © {new Date().getFullYear()} Suzuki Motorcycle Nepal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
