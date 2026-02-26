"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { teacherApi, type Unit, type LessonPlan, type Question } from "@/lib/api-client";
import {
  Loader2,
  BookOpen,
  Play,
  Sparkles,
  ChevronLeft,
  Clock,
  Target,
  Lightbulb,
  Code,
  ArrowRight,
  FileQuestion,
  Check,
  Upload,
} from "lucide-react";

interface LessonPlannerProps {
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  selectedGrade: string;
  onGradeChange: (value: string) => void;
  curriculum: { subject: string; grade: string; units: Unit[] } | null;
  onLoadCurriculum: () => void;
  isLoading: boolean;
}

export function LessonPlanner({
  subjects,
  selectedSubject,
  onSubjectChange,
  selectedGrade,
  onGradeChange,
  curriculum,
  onLoadCurriculum,
  isLoading,
}: LessonPlannerProps) {
  const [step, setStep] = useState<"select" | "plan">("select");
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; title: string } | null>(null);
  const [teachingLevel, setTeachingLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [preference, setPreference] = useState("");
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Assessment generation state
  const [assessmentQuestions, setAssessmentQuestions] = useState<Question[]>([]);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSelectUnit = (unitId: string, unitTitle: string) => {
    setSelectedUnit({ id: unitId, title: `${unitId}: ${unitTitle}` });
    setLessonPlan(null);
    setStep("plan");
  };

  const handleGenerateLessonPlan = async () => {
    if (!curriculum || !selectedUnit) return;

    setIsGenerating(true);
    try {
      const plan = await teacherApi.generateLessonPlan(
        curriculum.subject,
        curriculum.grade,
        selectedUnit.title,
        teachingLevel,
        preference,
        selectedUnit.id
      );
      setLessonPlan(plan);
    } catch (err) {
      console.error("[v0] Failed to generate lesson plan:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!curriculum) return;

    setIsGeneratingAssessment(true);
    try {
      const requests: Record<string, number> = {};
      curriculum.units.forEach((unit) => {
        requests[`${unit.unit_id}: ${unit.unit_title}`] = 5;
      });

      const data = await teacherApi.getBatchChapterResources(
        curriculum.subject,
        curriculum.grade,
        requests
      );

      const questions: Question[] = [];
      for (const resource of data.resources || []) {
        for (const q of resource.questions || []) {
          questions.push({ ...q, chapter: resource.chapter });
        }
      }

      setAssessmentQuestions(questions);
      setSelectedQuestions(new Set(questions.map((_, i) => i)));
      setShowPublishDialog(true);
    } catch (err) {
      console.error("[v0] Failed to generate assessment:", err);
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handlePublishQuestions = async () => {
    if (!curriculum || selectedQuestions.size === 0) return;

    setIsPublishing(true);
    try {
      const selectedQs = Array.from(selectedQuestions).map((i) => assessmentQuestions[i]);
      await teacherApi.publishQuestions(
        curriculum.subject,
        curriculum.grade,
        selectedQs,
        replaceExisting
      );
      setShowPublishDialog(false);
      setAssessmentQuestions([]);
    } catch (err) {
      console.error("[v0] Failed to publish questions:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleAllQuestions = () => {
    if (selectedQuestions.size === assessmentQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(assessmentQuestions.map((_, i) => i)));
    }
  };

  // Step 1: Select Course
  if (step === "select") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Course</CardTitle>
            <CardDescription>Choose a subject and load the curriculum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={onSubjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade/Year</Label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm">Year 2 (B.Tech)</span>
                </div>
              </div>
            </div>

            <Button
              onClick={onLoadCurriculum}
              disabled={!selectedSubject || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Load Units
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {curriculum && curriculum.units.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Units: {curriculum.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {curriculum.units.map((unit, index) => (
                    <AccordionItem key={unit.unit_id} value={unit.unit_id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{unit.unit_id}: {unit.unit_title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <h4 className="font-medium mb-2">Key Topics:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {unit.topics.map((topic, tidx) => (
                                <div
                                  key={tidx}
                                  className="bg-muted p-2 rounded text-sm"
                                >
                                  {topic.topic_name}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSelectUnit(unit.unit_id, unit.unit_title)}
                            className="w-full"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Plan Lesson
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Assessment</CardTitle>
                <CardDescription>Generate questions for all units</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateAssessment}
                  disabled={isGeneratingAssessment}
                  className="w-full"
                  variant="secondary"
                >
                  {isGeneratingAssessment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileQuestion className="h-4 w-4 mr-2" />
                      Generate Questions (All Units)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Publish Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>Review & Publish Questions</DialogTitle>
              <DialogDescription>
                Select questions to save to the Final Exam Database
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between py-2 shrink-0">
              <Button variant="outline" size="sm" onClick={toggleAllQuestions}>
                {selectedQuestions.size === assessmentQuestions.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedQuestions.size} of {assessmentQuestions.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 border rounded-md p-2">
              <div className="space-y-4">
                {assessmentQuestions.map((q, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedQuestions.has(index) ? "border-primary bg-primary/5" : ""
                      }`}
                    onClick={() => toggleQuestion(index)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedQuestions.has(index)}
                        onCheckedChange={() => toggleQuestion(index)}
                      />
                      <div className="flex-1">
                        <p className="font-medium mb-1">Q{index + 1}. {q.question}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{q.difficulty}</Badge>
                          <Badge variant="secondary">{q.chapter}</Badge>
                        </div>
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details" className="border-0">
                            <AccordionTrigger className="py-1 text-sm">Show Details</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm"><strong>Answer:</strong> {q.correct_answer}</p>
                              <p className="text-sm"><strong>Options:</strong> {q.options?.join(", ")}</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="shrink-0 my-2" />

            <div className="flex items-center gap-2 shrink-0">
              <Checkbox
                id="replace"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(checked === true)}
              />
              <Label htmlFor="replace" className="text-sm">
                Replace existing final exam questions?
              </Label>
            </div>

            <div className="flex gap-2 shrink-0 pt-2">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePublishQuestions}
                disabled={selectedQuestions.size === 0 || isPublishing}
                className="flex-1"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish Selected
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Step 2: Lesson Planning
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => setStep("select")} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Units
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Lesson Planner: {selectedUnit?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Teaching/Engagement Level</Label>
              <Select
                value={teachingLevel}
                onValueChange={(v) => setTeachingLevel(v as typeof teachingLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {teachingLevel === "beginner" && "Voice: ELI5, Analogies, Visuals. Focus on Concepts."}
                {teachingLevel === "intermediate" && "Voice: Standard B.Tech depth"}
                {teachingLevel === "advanced" && "Voice: Deep Dive, Edge Cases, Scalability. Focus on Application."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Teacher Preference</Label>
              <Textarea
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="Any specific requirements or focus areas..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleGenerateLessonPlan}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lesson Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lesson Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {!lessonPlan ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Set options and click Generate Plan</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {/* Meta Information */}
                  {lessonPlan.meta && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-1">Strategy</h4>
                          <p className="text-sm text-muted-foreground">
                            {lessonPlan.meta.why_this_structure || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Methodology</h4>
                          <p className="text-sm text-muted-foreground">
                            {lessonPlan.meta.teaching_level || "Standard"}
                          </p>
                        </div>
                        {lessonPlan.meta.estimated_time_breakdown && (
                          <div>
                            <h4 className="font-medium mb-2">Time Allocation</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(lessonPlan.meta.estimated_time_breakdown).map(([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline Items */}
                  {lessonPlan.timeline.map((item, index) => (
                    <TimelineItem key={index} item={item} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TimelineItem({ item }: { item: LessonPlan["timeline"][0] }) {
  const title = item.title || item.section || "Untitled Segment";
  const duration = item.duration || (item.duration_minutes ? `${item.duration_minutes} min` : "");

  // Summary card (special handling)
  if (item.type === "summary") {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(item.content) &&
            item.content.map((c, i) => {
              if (typeof c === "object" && c !== null && "term" in c) {
                const content = c as { term: string; definition: string };
                return (
                  <p key={i} className="text-sm mb-1">
                    <strong>{content.term}:</strong> {content.definition}
                  </p>
                );
              }
              return null;
            })}
        </CardContent>
      </Card>
    );
  }

  const rawContent = item.items || item.content || item.sections || [];
  const contentList = typeof rawContent === "string" ? [] : (rawContent as unknown[]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {duration && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}
            </Badge>
          )}
        </div>
        {item.reasoning && (
          <p className="text-sm text-muted-foreground">{item.reasoning}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CO Mapping */}
        {item.co_mapping && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Outcome Alignment:</span>
            <span>{item.co_mapping.codes?.join(", ")}</span>
            <span className="text-muted-foreground">(via {item.co_mapping.source})</span>
          </div>
        )}

        {/* Engagement Suggestions */}
        {item.engagement && item.engagement.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="engagement" className="border-0">
              <AccordionTrigger className="py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Engagement Suggestions
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {item.engagement.map((eng, engIdx) => {
                    if (typeof eng === "string") {
                      return (
                        <p key={engIdx} className="text-sm">
                          {eng}
                        </p>
                      );
                    }
                    return (
                      <div key={engIdx} className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {eng.duration_minutes}m
                          </Badge>
                          <span className="text-sm font-medium capitalize">
                            {eng.engagement_type?.replace("_", " ")}
                          </span>
                        </div>
                        {eng.teacher_script && (
                          <p className="text-sm">
                            <strong>Teacher Says:</strong> "{eng.teacher_script}"
                          </p>
                        )}
                        {eng.student_action && (
                          <p className="text-sm">
                            <strong>Students Do:</strong> {eng.student_action}
                          </p>
                        )}
                        {eng.key_realization && (
                          <p className="text-sm text-blue-600">
                            <strong>Key Realization:</strong> {eng.key_realization}
                          </p>
                        )}
                        {eng.quick_check && (
                          <p className="text-sm text-green-600">
                            <strong>Quick Check:</strong> {eng.quick_check}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Content Items */}
        {contentList.length > 0 && (
          <div className="space-y-2">
            {contentList.map((content, cidx) => {
              if (typeof content === "string") {
                return (
                  <p key={cidx} className="text-sm">
                    - {content}
                  </p>
                );
              }

              const contentObj = content as Record<string, unknown>;

              // Code block
              if ("code" in contentObj) {
                return (
                  <div key={cidx}>
                    <p className="text-sm font-medium mb-1">
                      {(contentObj.description as string) || "Code Example"}:
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      <code>{contentObj.code as string}</code>
                    </pre>
                  </div>
                );
              }

              // Term definition
              if ("term" in contentObj) {
                return (
                  <p key={cidx} className="text-sm">
                    <strong>{contentObj.term as string}:</strong> {contentObj.definition as string}
                  </p>
                );
              }

              // Question
              if ("question" in contentObj) {
                return (
                  <Accordion key={cidx} type="single" collapsible>
                    <AccordionItem value="q" className="border-0">
                      <AccordionTrigger className="py-1 text-sm text-left">
                        {contentObj.question as string}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm">
                          <strong>Answer:</strong> {contentObj.answer as string}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              }

              // Generic label + content
              if ("label" in contentObj && "content" in contentObj) {
                return (
                  <div key={cidx}>
                    <p className="text-sm font-medium">{contentObj.label as string}</p>
                    <p className="text-sm text-muted-foreground">{contentObj.content as string}</p>
                  </div>
                );
              }

              return (
                <p key={cidx} className="text-sm text-muted-foreground">
                  {JSON.stringify(contentObj)}
                </p>
              );
            })}
          </div>
        )}

        {/* String content */}
        {typeof rawContent === "string" && (
          <p className="text-sm">{rawContent}</p>
        )}
      </CardContent>
    </Card>
  );
}
