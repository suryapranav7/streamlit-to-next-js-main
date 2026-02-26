import React from "react"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, Brain, Target, BarChart3, MessageSquare, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <img
                src="/dimensionleap.png"
                alt="Dimension Leap"
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">B.Tech Curriculum</Badge>
            <Badge variant="secondary" className="text-xs">SYS.STATUS: ONLINE</Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance mb-6">
            The platform for AI-powered education
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8">
            Personalized learning paths, adaptive assessments, and intelligent lesson planning for modern B.Tech curriculum.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/student">
                <GraduationCap className="mr-2 h-5 w-5" />
                Student Portal
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/teacher">
                <BookOpen className="mr-2 h-5 w-5" />
                Teacher Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Student Portal</CardTitle>
                  <CardDescription>Personalized learning experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access your learning path, chat with AI tutors, take adaptive assessments, and track your progress across modules.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/student">Enter Student Portal</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Teacher Portal</CardTitle>
                  <CardDescription>Intelligent teaching tools</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Design lesson plans with AI assistance, generate assessments, and analyze class performance with detailed analytics.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/teacher">Enter Teacher Portal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Platform Capabilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Adaptive AI Tutor"
              description="Personalized explanations based on your learning style"
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Smart Assessments"
              description="Questions that adapt to your knowledge level"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Deep Analytics"
              description="Track progress with detailed performance insights"
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Instant Feedback"
              description="Real-time explanations for every answer"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Built with OpenAI + LangChain + Next.js
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Adaptive Learning</Badge>
            <Badge variant="outline">Outcome Based Education</Badge>
            <Badge variant="outline">Real-time Analytics</Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-lg p-6 border border-border">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
