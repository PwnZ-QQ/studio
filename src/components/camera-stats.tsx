'use client';

import { Button } from './ui/button';
import { X, BarChart2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface CameraStatsProps {
  onBack: () => void;
}

const data = [
  {
    name: 'Foto',
    pouziti: 43,
  },
  {
    name: 'Video',
    pouziti: 21,
  },
  {
    name: 'AR',
    pouziti: 15,
  },
  {
    name: 'QR',
    pouziti: 31,
  },
  {
    name: 'Text',
    pouziti: 18,
  },
];

export default function CameraStats({ onBack }: CameraStatsProps) {
  const t = useTranslations('CameraStats');

  return (
    <motion.div 
      className="absolute inset-0 bg-black/60 backdrop-blur-lg z-20 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/50" onClick={onBack}>
          <X className="h-5 w-5" />
      </Button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-background/80 backdrop-blur-lg p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-2xl font-bold text-white text-center mb-6 flex items-center justify-center gap-3">
          <BarChart2 className="h-7 w-7" />
          {t('title')}
        </h3>

        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#ffffff" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#ffffff" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ 
                            background: "rgba(30, 41, 59, 0.9)",
                            borderColor: "rgba(255,255,255,0.2)",
                            color: "#ffffff"
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: "14px" }}/>
                    <Bar dataKey="pouziti" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
