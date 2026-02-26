"use client";

import { useState, useEffect } from "react";
import { StudentSidebar } from "@/components/student/student-sidebar";
import { LearnTab } from "@/components/student/learn-tab";
import { AssessmentTab } from "@/components/student/assessment-tab";
import { AnalyticsTab } from "@/components/student/analytics-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { studentApi, type Subject, type Module, type Progress } from "@/lib/api-client";
import { BookOpen, FileQuestion, BarChart3 } from "lucide-react";

export default function StudentPage() {
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subjects when grade changes
  useEffect(() => {
    if (!grade) {
      setSubjects([]);
      setSelectedSubjectId(null);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const data = await studentApi.getSubjectsByGrade(grade);
        setSubjects(data);
        setSelectedSubjectId(null);
      } catch (err) {
        console.error("[v0] Failed to fetch subjects:", err);
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, [grade]);

  // Load modules and progress when subject or student changes
  useEffect(() => {
    if (!selectedSubjectId || !studentId) {
      setModules([]);
      setProgress([]);
      setSelectedModuleId(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Register student
        await studentApi.registerStudent(studentId, selectedSubjectId, grade);

        // Fetch modules and progress
        const [modulesData, progressData] = await Promise.all([
          studentApi.getModules(selectedSubjectId),
          studentApi.getProgress(studentId),
        ]);

        setModules(modulesData);
        setProgress(progressData);

        // Select first unlocked module by default
        const progressMap = new Map(progressData.map((p) => [p.module_id, p.status]));
        const firstUnlocked = modulesData.find(
          (m) => progressMap.get(m.module_id) === "unlocked"
        );
        if (firstUnlocked) {
          setSelectedModuleId(firstUnlocked.module_id);
        } else if (modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].module_id);
        }
      } catch (err) {
        console.error("[v0] Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSubjectId, studentId, grade]);

  const progressMap = new Map(progress.map((p) => [p.module_id, p]));
  const selectedModule = modules.find((m) => m.module_id === selectedModuleId);
  const selectedModuleStatus = selectedModuleId
    ? progressMap.get(selectedModuleId)?.status || "locked"
    : "locked";

  const canInteract = studentId && grade && selectedSubjectId;

  return (
    <div className="flex min-h-screen">
      <StudentSidebar
        studentId={studentId}
        onStudentIdChange={setStudentId}
        grade={grade}
        onGradeChange={setGrade}
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSubjectChange={setSelectedSubjectId}
        modules={modules}
        progress={progress}
        selectedModuleId={selectedModuleId}
        onModuleSelect={setSelectedModuleId}
        isLoading={isLoading}
      />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Learning Path</h1>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!canInteract ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">Welcome to the Student Portal</p>
              <p>Please enter your Student ID, Grade, and select a Subject from the sidebar to begin.</p>
            </div>
          ) : !selectedModuleId ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No modules available. Please select a subject.</p>
            </div>
          ) : (
            <Tabs defaultValue="learn" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="learn" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learn
                </TabsTrigger>
                <TabsTrigger value="assessment" className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  Assessment
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="learn" className="mt-6">
                <LearnTab
                  studentId={studentId}
                  moduleId={selectedModuleId}
                  moduleName={selectedModule?.module_name || ""}
                  moduleStatus={selectedModuleStatus}
                />
              </TabsContent>

              <TabsContent value="assessment" className="mt-6">
                <AssessmentTab
                  studentId={studentId}
                  moduleId={selectedModuleId}
                  moduleName={selectedModule?.module_name || ""}
                  moduleStatus={selectedModuleStatus}
                  onComplete={() => {
                    // Refresh progress after assessment
                    if (studentId) {
                      studentApi.getProgress(studentId).then(setProgress);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <AnalyticsTab
                  studentId={studentId}
                  subjectId={selectedSubjectId}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
