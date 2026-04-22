import { Calendar } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-muted/60 bg-background pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="bg-foreground text-background p-1.5 rounded-xl inline-flex">
              <Calendar size={20} />
            </div>
            <span className="font-semibold text-xl tracking-tight">EventMe</span>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The premium platform for seamless event management, smart hiring, and unforgettable experiences.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground mb-1">Product</h4>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground mb-1">Company</h4>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-muted/60 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} EventMe Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
