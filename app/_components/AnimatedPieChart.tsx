"use client";

import { useState, useEffect } from "react";

interface AnimatedPieChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  secondaryColor?: string;
  animationDuration?: number;
  showStatusColor?: boolean;
}

export default function AnimatedPieChart({
  percentage,
  size = 200,
  strokeWidth = 12,
  primaryColor,
  secondaryColor = "#e5e7eb",
  animationDuration = 800,
  showStatusColor = true,
}: AnimatedPieChartProps) {
  const [currentPercentage, setCurrentPercentage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Reset animation when percentage changes
    setCurrentPercentage(0);
    setIsAnimating(true);
  }, [percentage]);

  useEffect(() => {
    if (!isAnimating) return;

    const startTime = Date.now();
    const endTime = startTime + animationDuration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / animationDuration, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentPercentage(percentage * eased);

      if (now < endTime) {
        requestAnimationFrame(animate);
      } else {
        setCurrentPercentage(percentage);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [percentage, animationDuration, isAnimating]);

  const strokeDashoffset =
    circumference - (circumference * currentPercentage) / 100;

  const getStatusColor = () => {
    if (primaryColor) return primaryColor;
    if (percentage >= 75) return "#10b981";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const color = showStatusColor ? getStatusColor() : (primaryColor || "#10b981");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums transition-colors duration-500" style={{ color }}>
          {Math.round(currentPercentage)}%
        </span>
        <span className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-[0.15em]">Attendance</span>
      </div>
    </div>
  );
}
