"use client";

import { motion } from "framer-motion";
import { Users, CalendarDays, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "Event Creation",
    description: "Launch beautifully branded event pages in seconds. Manage ticketing, seating, and schedules effortlessly.",
    icon: CalendarDays,
  },
  {
    title: "Worker Hiring",
    description: "Discover, hire, and manage top-tier event staff through our seamless application workflow.",
    icon: Users,
  },
  {
    title: "Smart Analytics",
    description: "Gain real-time insights into ticket sales, attendee engagement, and financial performance.",
    icon: BarChart3,
  },
  {
    title: "Role-Based Access",
    description: "Secure, granular permissions for Admins, Managers, and Workers tailored to your organizational needs.",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 text-center md:text-left">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
        >
          Everything you need. <br className="hidden md:block"/>
          <span className="text-muted-foreground">Nothing you don't.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-xl"
        >
          Tools designed specifically to eliminate friction from planning, hiring, and execution.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group p-8 rounded-3xl bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors duration-300"
          >
            <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-muted/80 text-foreground group-hover:scale-110 transition-transform duration-300">
              <feature.icon size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
