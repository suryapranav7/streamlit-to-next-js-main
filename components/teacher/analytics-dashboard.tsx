"use client";

import React from "react"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#e11d48", // rose
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
];
import {
  teacherApi,
  type OverviewAnalytics,
  type PerformanceDistribution,
  type Leaderboard,
  type ExamAnalytics,
  type StudentDetail,
  type Student,
} from "@/lib/api-client";
import {
  Loader2,
  Users,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Brain,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { OBEDashboard } from "./obe-dashboard";

interface AnalyticsDashboardProps {
  subjects: string[];
}

export function AnalyticsDashboard({ subjects }: AnalyticsDashboardProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [perfDist, setPerfDist] = useState<PerformanceDistribution | null>(null);
  const [cohortDist, setCohortDist] = useState<Record<string, number> | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<unknown>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);

  const getSubjectId = (subjectName: string) => {
    const slug = subjectName.toLowerCase().replace(/ /g, "_");
    return `btech_${slug}_y2`;
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const subjectId = selectedSubject !== "all" ? getSubjectId(selectedSubject) : undefined;

      const [overviewData, perfData, cohortData, leaderboardData, studentsData] = await Promise.all([
        teacherApi.getOverview(subjectId),
        teacherApi.getPerformanceDistribution(subjectId),
        teacherApi.getCohortDistribution(subjectId),
        teacherApi.getLeaderboard(subjectId),
        teacherApi.getStudents(),
      ]);

      setOverview(overviewData);
      setPerfDist(perfData);
      setCohortDist(cohortData);
      setLeaderboard(leaderboardData);
      setStudents(studentsData.students || []);

      // Fetch exam analytics if specific subject selected
      if (subjectId) {
        try {
          const examData = await teacherApi.getExamAnalytics(subjectId);
          setExamAnalytics(examData);
        } catch {
          setExamAnalytics(null);
        }
      } else {
        setExamAnalytics(null);
      }

      setInsights(null);
      setInsightsData(null);
    } catch (err) {
      console.error("[v0] Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSubject]);

  const fetchInsights = async () => {
    if (selectedSubject === "all") return;

    setIsLoadingInsights(true);
    try {
      const subjectId = getSubjectId(selectedSubject);
      const data = await teacherApi.getInsights(subjectId);
      setInsights(data.insight);
      setInsightsData(data.data);
    } catch (err) {
      console.error("[v0] Failed to fetch insights:", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchStudentDetail = async (studentId: string) => {
    setIsLoadingStudent(true);
    setSelectedStudentId(studentId);
    try {
      const data = await teacherApi.getStudentDetails(studentId);
      console.log("DEBUG: Student Detail Data:", data); // Debug log
      setStudentDetail(data);
    } catch (err) {
      console.error("[v0] Failed to fetch student details:", err);
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const perfChartData = perfDist
    ? Object.entries(perfDist).map(([key, value]) => ({
      name: key,
      value,
    }))
    : [];

  const cohortChartData = cohortDist
    ? Object.entries(cohortDist).map(([key, value]) => ({
      name: key,
      value,
    }))
    : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="class" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="class">Class Performance</TabsTrigger>
          <TabsTrigger value="obe">Outcomes (OBE)</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="space-y-6 mt-6">
          {/* Subject Filter */}
          <div className="flex items-center gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[250px]" aria-label="Filter by Subject">
                <SelectValue placeholder="Filter by Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Class Average"
              value={`${overview?.class_average || 0}%`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <MetricCard
              label="Total Students"
              value={overview?.total_students?.toString() || "0"}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              label="At Risk (<50%)"
              value={perfDist?.["Needs Support (<50%)"]?.toString() || "0"}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant="destructive"
            />
            <MetricCard
              label="High Performers"
              value={perfDist?.["High Performers (>75%)"]?.toString() || "0"}
              icon={<Trophy className="h-5 w-5" />}
              variant="success"
            />
          </div>

          {/* Weak Areas Alert */}
          {overview?.common_weak_areas && overview.common_weak_areas.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Cohort Critical Weaknesses
                </CardTitle>
                <CardDescription>
                  Modules where the average cohort score is below 65%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module Name</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>Student Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.common_weak_areas.map((area) => (
                      <TableRow key={area.module_name}>
                        <TableCell>{area.module_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={area.cohort_average} className="w-20 h-2" />
                            <span>{area.cohort_average.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{area.students_attempted}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Bands</CardTitle>
                <CardDescription>Distribution of students by average score</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perfChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {perfChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Velocity</CardTitle>
                <CardDescription>Number of modules completed per student</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Students",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {cohortChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard?.top_5 && leaderboard.top_5.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.top_5.map((student, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{student.score}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Needs Intervention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard?.bottom_5 && leaderboard.bottom_5.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.bottom_5.map((student, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{student.score}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No students flagged</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Final Assignment Analytics */}
          {selectedSubject !== "all" && examAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Final Assignment Analytics</CardTitle>
                <CardDescription>Performance on the final exam for {selectedSubject}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {examAnalytics.submitted_count} / {examAnalytics.total_assigned}
                    </div>
                    <div className="text-sm text-muted-foreground">Submitted</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{examAnalytics.average_score}%</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{examAnalytics.pass_rate || 0}%</div>
                    <div className="text-sm text-muted-foreground">Pass Rate</div>
                  </div>
                </div>

                {examAnalytics.student_details && examAnalytics.student_details.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examAnalytics.student_details.map((student, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={student.score} className="w-20 h-2" />
                              <span>{student.score.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === "completed"
                                  ? "default"
                                  : student.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Teacher Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Teacher Insights
              </CardTitle>
              <CardDescription>AI analysis of student weak areas to help you plan</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSubject === "all" ? (
                <p className="text-muted-foreground">
                  Please select a specific Subject from the dropdown above to enable AI Insights.
                </p>
              ) : insights ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{insights}</div>
                </div>
              ) : (
                <Button onClick={fetchInsights} disabled={isLoadingInsights}>
                  {isLoadingInsights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Weak Areas & Recommend Actions
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Student Drill-down */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Student Drill-down</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedStudentId || ""}
                onValueChange={(value) => fetchStudentDetail(value)}
              >
                <SelectTrigger aria-label="Select Student">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.name || "Unknown"} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isLoadingStudent && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {studentDetail && !isLoadingStudent && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{studentDetail.average_score}%</div>
                      <div className="text-sm text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{studentDetail.overall_progress}%</div>
                      <div className="text-sm text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {studentDetail.modules?.filter((m) => m.status === "completed").length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>

                  {studentDetail.modules && studentDetail.modules.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Module Breakdown</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentDetail.modules.map((module, index) => {
                            // Robustly resolve module name by checking common keys
                            const moduleName =
                              module.module_name ||
                              (module as any).name ||
                              (module as any).title ||
                              (module as any).module ||
                              module.module_id ||
                              "Unknown Module";

                            return (
                              <TableRow key={module.module_id || `module-${index}`}>
                                <TableCell>{moduleName}</TableCell>
                                <TableCell>{module.score}%</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{module.status}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obe" className="mt-6">
          <OBEDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${variant === "destructive"
              ? "bg-destructive/10 text-destructive"
              : variant === "success"
                ? "bg-green-500/10 text-green-500"
                : "bg-muted text-foreground"
              }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
