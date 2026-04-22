"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "EventMe transformed how we organize our annual developer conference. The UI is just stunningly simple yet incredibly powerful.",
    author: "Sarah Jenkins",
    role: "Director of Events, TechCorp",
  },
  {
    quote: "Finding and hiring staff used to be a nightmare of spreadsheets. Now it's a seamless joy. It feels like a platform built for the modern era.",
    author: "Michael Chang",
    role: "Lead Coordinator, VenueX",
  },
  {
    quote: "The analytics dashboard gave us insights we never knew we needed. We boosted ticket sales by 40% using the data provided.",
    author: "Emma Roberts",
    role: "Founder, Creative Nights",
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
       <div className="text-center mb-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
        >
          Loved by top organizers.
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {testimonials.map((test, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="flex flex-col p-8 rounded-3xl bg-background border border-muted/60 shadow-sm"
          >
            <div className="text-accent mb-6">
              {/* Minimal quote mark icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 11L8 15V15.5H10.5V18.5H5.5V15L7.5 11H10ZM19 11L17 15V15.5H19.5V18.5H14.5V15L16.5 11H19ZM11.5 9.5H6.5L4 15V20H12V14.5H9L11.5 9.5ZM20.5 9.5H15.5L13 15V20H21V14.5H18L20.5 9.5Z" />
              </svg>
            </div>
            <p className="text-lg text-foreground font-medium mb-8 flex-1 leading-relaxed">
              "{test.quote}"
            </p>
            <div>
              <p className="font-bold text-foreground">{test.author}</p>
              <p className="text-sm text-muted-foreground">{test.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
