"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import { Users, Clock, ChevronRight } from "lucide-react";

interface ClassCardProps {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  schedule: string;
  room: string;
  onClick: (id: string) => void;
}

export function ClassCard({
  id,
  name,
  subject,
  studentCount,
  schedule,
  room,
  onClick,
}: ClassCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
      onClick={() => onClick(id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                {subject}
              </p>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{studentCount} students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{schedule}</span>
              </div>
            </div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
              Room {room}
            </div>
          </div>
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
