"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden pt-24 pb-16 px-6">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-muted-foreground/10 text-sm font-medium mb-8"
        >
          <Sparkles size={16} className="text-accent" />
          <span>The future of event management</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
        >
          Manage Events <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
            Effortlessly.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          A premium platform designed to orchestrate your events, manage your workforce, and deliver unforgettable experiences with absolute precision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Button size="lg" className="w-full sm:w-auto gap-2 group">
            Start Free Trial
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Book a Demo
          </Button>
        </motion.div>
      </div>

      {/* Dashboard Preview Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="w-full max-w-5xl mt-20 z-10 perspective-1000"
      >
        <div className="relative rounded-2xl md:rounded-[2rem] border border-muted/50 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none" />
          {/* Faux browser header */}
          <div className="h-12 border-b border-muted/50 flex items-center px-6 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          {/* Skeleton UI to represent dashboard */}
          <div className="p-8 flex gap-8 h-full">
            <div className="w-64 flex flex-col gap-4 hidden md:flex">
              <div className="h-8 w-3/4 rounded-lg bg-muted/60" />
              <div className="h-4 w-1/2 rounded-lg bg-muted/40 mt-4" />
              <div className="h-4 w-2/3 rounded-lg bg-muted/40" />
              <div className="h-4 w-1/3 rounded-lg bg-muted/40" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="h-12 w-full rounded-xl bg-muted/60 flex items-center px-4 justify-between">
                <div className="h-5 w-32 rounded-md bg-background/50" />
                <div className="h-8 w-24 rounded-full bg-accent/20" />
              </div>
              <div className="flex gap-4">
                <div className="h-32 w-1/3 rounded-xl bg-muted/40" />
                <div className="h-32 w-1/3 rounded-xl bg-muted/40" />
                <div className="h-32 w-1/3 rounded-xl bg-muted/40" />
              </div>
              <div className="h-64 w-full rounded-xl bg-muted/30 mt-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
