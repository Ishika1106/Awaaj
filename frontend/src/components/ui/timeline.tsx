'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 20%', 'end 80%'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <div className="absolute left-4 top-0 h-full w-[2px] bg-orange-200 md:left-1/2 md:-translate-x-px">
        <motion.div
          className="w-full origin-top bg-gradient-to-b from-orange-500 via-red-500 to-amber-500"
          style={{ height: lineHeight }}
        />
      </div>

      {data.map((item, idx) => {
        const isLeft = idx % 2 === 0;
        return (
          <div
            key={idx}
            className={`relative mb-12 pl-12 md:mb-20 md:w-1/2 md:pl-0 ${
              isLeft ? 'md:pr-12 md:text-right' : 'md:ml-auto md:pl-12'
            }`}
          >

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <h3 className="mb-4 text-lg font-bold text-orange-600 md:text-xl">
                {item.title}
              </h3>
              <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm md:p-6">
                {item.content}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
