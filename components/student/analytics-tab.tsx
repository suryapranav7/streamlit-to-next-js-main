"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studentApi, type AnalyticsResponse } from "@/lib/api-client";
import { BarChart3, Loader2, TrendingUp, CheckCircle2, AlertTriangle, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const CHART_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#e11d48", // rose
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
];

interface AnalyticsTabProps {
  studentId: string;
  subjectId: string | null;
}

export function AnalyticsTab({ studentId, subjectId }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!studentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await studentApi.getAnalytics(studentId, subjectId || undefined);
      setAnalytics(data);
    } catch (err) {
      console.error("[v0] Failed to fetch analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (!analytics && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Student Analytics Report
          </CardTitle>
          <CardDescription>
            View your performance insights and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <Button onClick={fetchAnalytics} className="w-full">
            Generate Analytics Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyzing performance...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const { analytics: data, explanation } = analytics;
  const moduleChartData = data.module_breakdown.map((m) => ({
    name: m.module_name || m.module_id,
    score: Math.round(m.score * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics - "Total Modules" removed as requested */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          label="Overall Progress"
          value={`${Math.round(data.overall_progress * 100)}%`}
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5 text-green-500" />}
          label="Average Score"
          value={`${Math.round(data.average_score * 100)}%`}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-purple-500" />}
          label="Modules Completed"
          value={data.completed_modules.toString()}
        />
      </div>

      {/* Module Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Module Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {moduleChartData.length > 0 ? (
            <ChartContainer
              config={{
                score: {
                  label: "Score",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`${value}%`, "Score"]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {moduleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No module data available yet. Complete some assessments to see your progress.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {data.weak_areas && data.weak_areas.length > 0 && (
        <Card className="border-muted bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Focus Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.weak_areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Deeper Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,
                h2: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props} />,
                h3: ({ node, ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />,
                strong: ({ node, ...props }) => <span className="font-semibold text-foreground" {...props} />,
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              }}
            >
              {explanation}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <Button onClick={fetchAnalytics} variant="outline" className="w-full bg-transparent">
        Refresh Analytics
      </Button>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
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
