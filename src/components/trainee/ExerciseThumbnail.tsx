"use client";

import React, { useState } from "react";
import { Dumbbell, Activity, Cpu, User } from "lucide-react";
import {
  cn,
  isSafeUrl,
  getOpenGymStillUrl,
  inferApparatusFromExercise,
} from "@/lib/utils";

export { inferApparatusFromExercise };

export type ExerciseThumbnailSize = "xs" | "sm" | "md" | "lg";

export interface ExerciseThumbnailProps {
  exerciseId?: string;
  exerciseName: string;
  stillUrl?: string;
  imageUrl?: string;
  size?: ExerciseThumbnailSize;
  className?: string;
  equipment?: string;
  fallback?: React.ReactNode;
}

const SIZE_STYLES: Record<ExerciseThumbnailSize, { container: string; icon: string }> = {
  xs: { container: "w-5 h-5 rounded-md", icon: "w-3 h-3" },
  sm: { container: "w-8 h-8 rounded-lg", icon: "w-4 h-4" },
  md: { container: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
  lg: { container: "w-16 h-16 rounded-xl", icon: "w-8 h-8" },
};

function renderApparatusIcon(
  apparatus: "dumbbell" | "barbell" | "cable" | "machine" | "bodyweight",
  iconClass: string
) {
  switch (apparatus) {
    case "barbell":
      return (
        <Dumbbell
          className={cn(iconClass, "text-cyan-400/90 rotate-45")}
          aria-hidden="true"
        />
      );
    case "cable":
      return (
        <Activity
          className={cn(iconClass, "text-indigo-400/90")}
          aria-hidden="true"
        />
      );
    case "machine":
      return (
        <Cpu
          className={cn(iconClass, "text-emerald-400/90")}
          aria-hidden="true"
        />
      );
    case "bodyweight":
      return (
        <User
          className={cn(iconClass, "text-rose-400/90")}
          aria-hidden="true"
        />
      );
    case "dumbbell":
    default:
      return (
        <Dumbbell
          className={cn(iconClass, "text-amber-400/90")}
          aria-hidden="true"
        />
      );
  }
}

export function ExerciseThumbnail({
  exerciseId,
  exerciseName,
  stillUrl,
  imageUrl,
  size = "sm",
  className,
  equipment,
  fallback,
}: ExerciseThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Derive candidate image URL: explicit stillUrl -> explicit imageUrl -> OpenGym still CDN
  let candidateUrl: string | undefined = undefined;
  if (stillUrl && stillUrl.trim()) {
    candidateUrl = stillUrl.trim();
  } else if (imageUrl && imageUrl.trim()) {
    candidateUrl = imageUrl.trim();
  } else if (exerciseId && /\d/.test(exerciseId)) {
    candidateUrl = getOpenGymStillUrl(exerciseId);
  }

  const resolvedUrl =
    candidateUrl && isSafeUrl(candidateUrl) ? candidateUrl : undefined;

  const hasError = Boolean(resolvedUrl && failedUrl === resolvedUrl);

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const apparatus = inferApparatusFromExercise(exerciseName, equipment);

  const containerClasses = cn(
    "relative shrink-0 overflow-hidden flex items-center justify-center bg-[#070b12] border border-[#1C2436]",
    sizeStyle.container,
    className
  );

  if (resolvedUrl && !hasError) {
    return (
      <div className={containerClasses} title={exerciseName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={exerciseName || "Exercise visual demonstration"}
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(resolvedUrl)}
          loading="lazy"
        />
      </div>
    );
  }

  if (fallback) {
    return (
      <div className={containerClasses} title={exerciseName}>
        {fallback}
      </div>
    );
  }

  return (
    <div
      className={containerClasses}
      title={exerciseName}
      aria-label={`${exerciseName || "Exercise"} (${apparatus})`}
    >
      {renderApparatusIcon(apparatus, sizeStyle.icon)}
    </div>
  );
}

export default ExerciseThumbnail;
