"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "./button";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setHasScrolled(latest > 20);
  });

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 transition-all duration-500",
        hasScrolled
          ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-muted/50 py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
          <div className="bg-foreground text-background p-1.5 rounded-xl">
            <Calendar size={20} />
          </div>
          <span className="font-semibold text-lg tracking-tight">EventMe</span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <NavLink href="/#features">Features</NavLink>
        <NavLink href="/#events">Upcoming Events</NavLink>
        <NavLink href="/#testimonials">Reviews</NavLink>
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/login" tabIndex={-1}>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Login
          </Button>
        </Link>
        <Link href="/signup" tabIndex={-1}>
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    </motion.header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
