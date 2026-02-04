"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { CountUp } from "@/components/animations/CountUp";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

export function StatsCard({ label, value, icon: Icon, gradient, iconColor }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-white`} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-4xl font-bold text-slate-900">
              <CountUp end={value} duration={1.5} />
            </div>
            <p className="text-sm text-slate-600">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
