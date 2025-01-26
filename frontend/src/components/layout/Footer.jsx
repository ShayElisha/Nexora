const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Section 1: Logo and Description */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-blue-400 text-xl font-bold">NEXORA</h1>
          <p className="text-sm mt-2">
            Simplifying business management, one solution at a time.
          </p>
        </div>

        {/* Section 2: Links */}
        <div className="mb-4 md:mb-0 flex flex-col md:flex-row gap-4">
          <a href="/about" className="hover:text-blue-400">
            About Us
          </a>
          <a href="/services" className="hover:text-blue-400">
            Services
          </a>
          <a href="/contact" className="hover:text-blue-400">
            Contact
          </a>
          <a href="/privacy" className="hover:text-blue-400">
            Privacy Policy
          </a>
        </div>

        {/* Section 3: Social Media */}
        <div className="flex gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-instagram"></i>
          </a>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
