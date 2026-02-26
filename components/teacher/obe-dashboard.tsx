"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teacherApi, type CourseOutcome } from "@/lib/api-client";
import { Loader2, Target, TrendingUp, Users, AlertCircle } from "lucide-react";

interface COAttainment {
  co_id: string;
  co_code: string;
  avg_attainment: number;
  student_count: number;
}

interface POAttainment {
  po_id: string;
  attainment: number;
}

export function OBEDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coResults, setCOResults] = useState<Record<string, COAttainment>>({});
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>([]);
  const [poResults, setPOResults] = useState<POAttainment[]>([]);
  const [avgAttainment, setAvgAttainment] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  const subjectId = "DS203"; // Hardcoded for pilot

  useEffect(() => {
    const fetchOBEData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch CO Attainment from backend
        const [coData, cos] = await Promise.all([
          teacherApi.getCOAttainment(subjectId),
          teacherApi.getCourseOutcomes(subjectId)
        ]);

        setCOResults(coData);
        setCourseOutcomes(cos);

        // Calculate averages
        const coValues = Object.values(coData);
        if (coValues.length > 0) {
          const total = coValues.reduce((sum, r) => sum + r.avg_attainment, 0);
          setAvgAttainment(total / coValues.length);
          setStudentCount(coValues[0]?.student_count || 0);
        }

        // Fetch PO Attainment
        const poData = await teacherApi.getPOAttainment(subjectId);
        setPOResults(poData);
      } catch (err) {
        console.error("[v0] Failed to fetch OBE data:", err);
        setError(err instanceof Error ? err.message : "Failed to load OBE analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOBEData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Failed to Load OBE Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure the backend OBE endpoints are available at {process.env.NEXT_PUBLIC_TEACHER_API_URL || "http://localhost:8001"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const coChartData = Object.entries(coResults).map(([code, data]) => ({
    name: code,
    attainment: data.avg_attainment,
  }));

  const poChartData = poResults.map((po) => ({
    subject: po.po_id,
    attainment: po.attainment,
  }));

  // Reference PO definitions (NBA standard)
  const poDefinitions = [
    { po_id: "PO1", title: "Engineering Knowledge", description: "Apply engineering fundamentals and specialization knowledge" },
    { po_id: "PO2", title: "Problem Analysis", description: "Identify, formulate, and analyze complex engineering problems" },
    { po_id: "PO3", title: "Design/Development", description: "Design solutions for complex engineering problems" },
    { po_id: "PO4", title: "Investigation", description: "Conduct investigations using research-based knowledge" },
    { po_id: "PO5", title: "Modern Tools", description: "Create, select and apply appropriate techniques and tools" },
    { po_id: "PO6", title: "Engineer & Society", description: "Apply contextual knowledge to assess societal impact" },
    { po_id: "PO7", title: "Environment", description: "Understand impact on sustainability and environment" },
    { po_id: "PO8", title: "Ethics", description: "Apply ethical principles and professional responsibility" },
    { po_id: "PO9", title: "Teamwork", description: "Function effectively as individual and team member" },
    { po_id: "PO10", title: "Communication", description: "Communicate effectively with engineering community" },
    { po_id: "PO11", title: "Project Management", description: "Apply engineering and management principles" },
    { po_id: "PO12", title: "Life-long Learning", description: "Engage in independent and life-long learning" },
  ];

  const hasData = coChartData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OBE Analytics Dashboard</h2>
          <p className="text-muted-foreground">Subject: Data Structures ({subjectId})</p>
        </div>
        {hasData && <Badge variant="secondary">Live Data</Badge>}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No assessment data available for this subject yet. Complete some assessments to see OBE analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgAttainment.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Class Avg Attainment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentCount}</p>
                    <p className="text-sm text-muted-foreground">Student Samples</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Object.keys(coResults).length}</p>
                    <p className="text-sm text-muted-foreground">Course Outcomes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CO Attainment Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Course Outcome (CO) Attainment</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  attainment: {
                    label: "Attainment",
                    color: "hsl(142 76% 36%)",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coChartData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attainment"]}
                    />
                    <Bar
                      dataKey="attainment"
                      fill="var(--color-attainment)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* PO Attainment Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Program Outcome (PO) Attainment</CardTitle>
            </CardHeader>
            <CardContent>
              {poChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    attainment: {
                      label: "Attainment",
                      color: "hsl(217 91% 60%)",
                    },
                  }}
                  className="h-[500px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={poChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Class PO Attainment"
                        dataKey="attainment"
                        stroke="hsl(217 91% 60%)"
                        fill="hsl(217 91% 60%)"
                        fillOpacity={0.3}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attainment"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No PO mappings found. Please map COs to POs in the Outcomes Manager.
                </p>
              )}

              {poChartData.length > 0 && (
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="data">
                    <AccordionTrigger>View Data</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PO ID</TableHead>
                            <TableHead>Attainment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {poResults.map((po) => (
                            <TableRow key={po.po_id}>
                              <TableCell>{po.po_id}</TableCell>
                              <TableCell>{po.attainment.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* PO Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Reference: Program Outcomes (NBA)</CardTitle>
          <CardDescription>Standard definitions for B.Tech CSE</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO ID</TableHead>
                <TableHead>Short Title</TableHead>
                <TableHead>Full Definition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poDefinitions.map((po) => (
                <TableRow key={po.po_id}>
                  <TableCell className="font-medium">{po.po_id}</TableCell>
                  <TableCell>{po.title}</TableCell>
                  <TableCell className="text-muted-foreground">{po.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
