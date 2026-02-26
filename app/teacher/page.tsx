"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonPlanner } from "@/components/teacher/lesson-planner";
import { AnalyticsDashboard } from "@/components/teacher/analytics-dashboard";
import { OutcomesManager } from "@/components/teacher/outcomes-manager";
import { teacherApi, type Unit } from "@/lib/api-client";
import { GraduationCap, BookOpen, BarChart3, Target, Home, Loader2 } from "lucide-react";

export default function TeacherPage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState("2");
  const [curriculum, setCurriculum] = useState<{ subject: string; grade: string; units: Unit[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("planner");

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await teacherApi.getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("[v0] Failed to fetch subjects:", err);
      }
    };
    fetchSubjects();
  }, []);

  // Load curriculum when subject/grade changes
  const loadCurriculum = async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    try {
      const data = await teacherApi.getCurriculum(selectedSubject, selectedGrade);
      setCurriculum({
        subject: selectedSubject,
        grade: selectedGrade,
        units: data.units || [],
      });
    } catch (err) {
      console.error("[v0] Failed to fetch curriculum:", err);
      setCurriculum(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-background" />
              </div>
              <span className="font-semibold">Teacher Agent: B.Tech Curriculum</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="planner" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lesson Planner
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Outcomes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planner">
            <LessonPlanner
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              selectedGrade={selectedGrade}
              onGradeChange={setSelectedGrade}
              curriculum={curriculum}
              onLoadCurriculum={loadCurriculum}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard subjects={subjects} />
          </TabsContent>

          <TabsContent value="outcomes">
            <OutcomesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
