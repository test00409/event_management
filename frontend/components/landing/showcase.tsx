"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const events = [
  {
    title: "Global Tech Summit 2026",
    date: "Oct 15 - Oct 18, 2026",
    location: "San Francisco, CA",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
    category: "Technology",
  },
  {
    title: "Design Leadership Conference",
    date: "Nov 02 - Nov 04, 2026",
    location: "London, UK",
    image: "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?q=80&w=1974&auto=format&fit=crop",
    category: "Design",
  },
  {
    title: "Modern Healthcare Symposium",
    date: "Dec 10, 2026",
    location: "New York, NY",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    category: "Healthcare",
  },
];

export function Showcase() {
  return (
    <section id="events" className="py-24 px-6 md:px-12 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            >
              Upcoming Events.
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ delay: 0.1 }}
               className="text-muted-foreground text-lg"
            >
              Discover what's happening around the globe.
            </motion.p>
          </div>
          <motion.a 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            href="#" 
            className="hidden md:flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
          >
            View all events <ArrowUpRight size={16} />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-6">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                  {event.category}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
              <p className="text-muted-foreground font-medium mb-1">{event.date}</p>
              <p className="text-muted-foreground text-sm">{event.location}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
