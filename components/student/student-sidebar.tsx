"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Home, Lock, CheckCircle2, Unlock, Loader2 } from "lucide-react";
import type { Subject, Module, Progress } from "@/lib/api-client";

interface StudentSidebarProps {
  studentId: string;
  onStudentIdChange: (value: string) => void;
  grade: string;
  onGradeChange: (value: string) => void;
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSubjectChange: (value: string | null) => void;
  modules: Module[];
  progress: Progress[];
  selectedModuleId: string | null;
  onModuleSelect: (moduleId: string) => void;
  isLoading: boolean;
}

export function StudentSidebar({
  studentId,
  onStudentIdChange,
  grade,
  onGradeChange,
  subjects,
  selectedSubjectId,
  onSubjectChange,
  modules,
  progress,
  selectedModuleId,
  onModuleSelect,
  isLoading,
}: StudentSidebarProps) {
  const progressMap = new Map(progress.map((p) => [p.module_id, p.status]));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "unlocked":
        return <Unlock className="h-4 w-4 text-blue-500" />;
      case "in_progress":
        return <Unlock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <aside className="w-72 border-r border-border bg-sidebar min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
          <Home className="h-4 w-4" />
          <span className="text-sm">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">Student Portal</span>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 space-y-4">
        <h2 className="font-semibold text-sm text-sidebar-foreground">Student Profile</h2>

        <div className="space-y-2">
          <Label htmlFor="student-id" className="text-sidebar-foreground">Student ID</Label>
          <Input
            id="student-id"
            placeholder="Enter ID"
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade" className="text-sidebar-foreground">Grade</Label>
          <Input
            id="grade"
            placeholder="e.g. 9 or 2"
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border"
          />
        </div>

        {grade && subjects.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sidebar-foreground">Subject</Label>
            <Select
              value={selectedSubjectId || ""}
              onValueChange={(value) => onSubjectChange(value || null)}
            >
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {grade && subjects.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No subjects found for Grade {grade}
          </p>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Modules Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="font-semibold text-sm mb-4 text-sidebar-foreground">Modules</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Select a subject to view modules
          </p>
        ) : (
          <RadioGroup
            value={selectedModuleId || ""}
            onValueChange={onModuleSelect}
            className="space-y-2"
          >
            {modules.map((module) => {
              const status = progressMap.get(module.module_id) || "locked";
              return (
                <div
                  key={module.module_id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedModuleId === module.module_id
                      ? "bg-sidebar-accent border-sidebar-primary"
                      : "border-transparent hover:bg-sidebar-accent/50"
                  }`}
                  onClick={() => onModuleSelect(module.module_id)}
                >
                  <RadioGroupItem
                    value={module.module_id}
                    id={module.module_id}
                    className="sr-only"
                  />
                  {getStatusIcon(status)}
                  <label
                    htmlFor={module.module_id}
                    className="text-sm cursor-pointer flex-1 text-sidebar-foreground"
                  >
                    {module.module_name}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
        )}
      </div>
    </aside>
  );
}
