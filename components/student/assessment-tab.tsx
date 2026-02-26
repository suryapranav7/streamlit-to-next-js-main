"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { studentApi, type Question } from "@/lib/api-client";
import { Lock, Play, CheckCircle2, XCircle, Loader2, RefreshCw, Trophy, AlertTriangle, Lightbulb } from "lucide-react";

interface AssessmentState {
  active: boolean;
  complete: boolean;
  isFinal: boolean;
  questions: Question[];
  currentIndex: number;
  score: number;
  difficulty: string;
  history: Array<{
    question: string;
    answer: string;
    feedback: string;
    correct: boolean;
  }>;
}

interface AssessmentTabProps {
  studentId: string;
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  onComplete: () => void;
}

const TARGET_QUESTIONS = 6;

export function AssessmentTab({
  studentId,
  moduleId,
  moduleName,
  moduleStatus,
  onComplete,
}: AssessmentTabProps) {
  const [state, setState] = useState<AssessmentState>({
    active: false,
    complete: false,
    isFinal: false,
    questions: [],
    currentIndex: 0,
    score: 0,
    difficulty: "medium",
    history: [],
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [weakTopicNames, setWeakTopicNames] = useState<string[]>([]);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(false);

  const isFinalModule = moduleId.toLowerCase().includes("final") || moduleName.toLowerCase().includes("assessment");
  const totalQuestions = state.isFinal && state.questions.length > 0 ? state.questions.length : TARGET_QUESTIONS;

  // Resolve topic names and generate study plan when assessment completes
  useEffect(() => {
    if (!state.complete) return;

    const resolveTopicsAndGeneratePlan = async () => {
      // Collect weak topic IDs
      const weakTopicIds = new Set<string>();
      state.history.forEach((h, idx) => {
        if (!h.correct && state.questions[idx]?.topic_id) {
          weakTopicIds.add(state.questions[idx].topic_id!);
        }
      });

      // Resolve topic names from IDs
      const resolvedNames: string[] = [];
      for (const topicId of weakTopicIds) {
        try {
          const topicData = await studentApi.getTopic(topicId);
          resolvedNames.push(topicData.topic_name || topicId);
        } catch {
          resolvedNames.push(topicId);
        }
      }
      setWeakTopicNames(resolvedNames);

      // Generate study plan
      const finalScore = state.score / totalQuestions;
      const passed = finalScore >= 0.6;

      setIsLoadingStudyPlan(true);
      try {
        const prompt = `Based on this assessment performance, provide 3 specific study tips or topics to review. Be encouraging but direct. Score: ${(finalScore * 100).toFixed(0)}%. Passed: ${passed}. Weak Areas: ${resolvedNames.join(", ") || "None identified"}`;

        const result = await studentApi.learn(studentId, prompt, {
          module_id: moduleId,
          system_instruction: "You are a study coach. Analyze the performance and provide actionable study recommendations."
        });
        setStudyPlan(result.response);
      } catch (err) {
        console.error("[v0] Failed to generate study plan:", err);
        setStudyPlan("Could not generate study suggestions at this time.");
      } finally {
        setIsLoadingStudyPlan(false);
      }
    };

    resolveTopicsAndGeneratePlan();
  }, [state.complete, state.history, state.questions, state.score, totalQuestions, studentId, moduleId]);

  const startAssessment = async () => {
    // Reset study plan state
    setWeakTopicNames([]);
    setStudyPlan(null);

    setState((prev) => ({
      ...prev,
      active: true,
      complete: false,
      isFinal: isFinalModule,
      questions: [],
      currentIndex: 0,
      score: 0,
      difficulty: "medium",
      history: [],
    }));

    if (isFinalModule) {
      setIsLoading(true);
      try {
        const questions = await studentApi.getFinalQuestions(moduleId);
        setState((prev) => ({ ...prev, questions }));
      } catch (err) {
        console.error("[v0] Failed to load final questions:", err);
        setState((prev) => ({ ...prev, active: false }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generateNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const question = await studentApi.generateQuestion(studentId, moduleId, state.difficulty);
      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, question],
      }));
    } catch (err) {
      console.error("[v0] Failed to generate question:", err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, moduleId, state.difficulty]);

  const submitAnswer = async () => {
    if (!selectedAnswer) return;

    const currentQuestion = state.questions[state.currentIndex];
    const questionText = formatQuestionText(currentQuestion);
    const questionId = currentQuestion.question_id;

    setIsEvaluating(true);
    try {
      const result = await studentApi.evaluateAnswer(studentId, questionText, selectedAnswer, questionId);

      const newHistory = [
        ...state.history,
        {
          question: questionText,
          answer: selectedAnswer,
          feedback: result.feedback,
          correct: result.is_correct,
        },
      ];

      const newScore = result.is_correct ? state.score + 1 : state.score;
      const newDifficulty = result.is_correct ? "hard" : "easy";
      const nextIndex = state.currentIndex + 1;
      const isComplete = nextIndex >= totalQuestions;

      setState((prev) => ({
        ...prev,
        score: newScore,
        difficulty: newDifficulty,
        history: newHistory,
        currentIndex: nextIndex,
        complete: isComplete,
        active: !isComplete,
      }));

      setSelectedAnswer(null);

      if (isComplete) {
        // Record assessment
        const finalScore = newScore / totalQuestions;
        const passed = finalScore >= 0.6;
        try {
          await studentApi.recordAssessment(studentId, moduleId, finalScore, passed, newHistory.map((h, idx) => ({
            question_id: state.questions[idx]?.question_id,
            student_answer: h.answer,
            is_correct: h.correct,
          })));
          onComplete();
        } catch (err) {
          console.error("[v0] Failed to record assessment:", err);
        }
      }
    } catch (err) {
      console.error("[v0] Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAssessment = () => {
    setState({
      active: false,
      complete: false,
      isFinal: false,
      questions: [],
      currentIndex: 0,
      score: 0,
      difficulty: "medium",
      history: [],
    });
    setSelectedAnswer(null);
    setWeakTopicNames([]);
    setStudyPlan(null);
  };

  const formatQuestionText = (q: Question): string => {
    let text = q.question;
    if (q.options && q.options.length > 0) {
      const optionLetters = ["A", "B", "C", "D"];
      const formattedOptions = q.options
        .map((opt, i) => `${optionLetters[i]}) ${opt}`)
        .join("\n\n");
      text += `\n\n${formattedOptions}`;
    }
    return text;
  };

  // Locked state
  if (moduleStatus === "locked") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Module Locked</h3>
          <p className="text-muted-foreground">
            Complete the previous modules first to take this assessment.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Completed previously
  if (moduleStatus === "completed" && !state.active && !state.complete) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Module Completed</h3>
          <p className="text-muted-foreground mb-6">
            You have already passed this module. You can retake to improve your score.
          </p>
          <Button onClick={startAssessment}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Assessment complete - show results
  if (state.complete) {
    const finalScore = state.score / totalQuestions;
    const passed = finalScore >= 0.6;
    const easyCount = state.history.filter((_, idx) => state.questions[idx]?.difficulty === "easy").length;
    const hardCount = state.history.length - easyCount;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Assessment Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <div className={`text-4xl font-bold mb-2 ${passed ? "text-green-500" : "text-destructive"}`}>
              {(finalScore * 100).toFixed(0)}%
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-1">
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-semibold">{easyCount}</div>
              <div className="text-sm text-muted-foreground">Easy Questions</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-semibold">{hardCount}</div>
              <div className="text-sm text-muted-foreground">Hard Questions</div>
            </div>
          </div>

          {weakTopicNames.length > 0 && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-destructive">Focus Areas</span>
              </div>
              <p className="text-sm">{weakTopicNames.join(", ")}</p>
            </div>
          )}

          {/* Personalized Study Plan */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Personalized Study Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStudyPlan ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI Tutor is analyzing your results...</span>
                </div>
              ) : studyPlan ? (
                <div className="text-sm font-sans break-words">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <span className="font-bold">{children}</span>,
                      em: ({ children }) => <span className="italic">{children}</span>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                    }}
                  >
                    {studyPlan}
                  </ReactMarkdown>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger>View Detailed Report</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {state.history.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        {item.correct ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      <pre className="text-sm whitespace-pre-wrap mb-2 text-muted-foreground">
                        {item.question}
                      </pre>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Your Answer:</span> {item.answer}
                      </p>
                      <p className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">Feedback:</span> {item.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button onClick={resetAssessment} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Take Another Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not started
  if (!state.active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment: {moduleName}</CardTitle>
          <CardDescription>
            Test your understanding of this module
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Total Questions:</strong> {isFinalModule ? "All (Final Exam)" : "6 (Standard)"}</p>
            <p><strong>Difficulty:</strong> Adapts based on your answers</p>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Correct answers lead to harder questions</li>
              <li>Incorrect answers lead to easier questions</li>
              <li>This helps identify your actual skill level</li>
            </ul>
          </div>
          <Button onClick={startAssessment} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active assessment - need to generate question
  if (state.questions.length <= state.currentIndex && !state.isFinal) {
    if (!isLoading) {
      generateNextQuestion();
    }
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating question...</p>
        </CardContent>
      </Card>
    );
  }

  // Loading final questions
  if (isLoading && state.isFinal) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading assessment questions...</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>No question available</p>
        </CardContent>
      </Card>
    );
  }

  const questionText = formatQuestionText(currentQuestion);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">Question {state.currentIndex + 1} of {totalQuestions}</CardTitle>
          <Badge variant="outline">{currentQuestion.difficulty || state.difficulty}</Badge>
        </div>
        <Progress value={(state.currentIndex / totalQuestions) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <pre className="whitespace-pre-wrap font-sans text-sm">{questionText}</pre>
        </div>

        <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
          {["A", "B", "C", "D"].map((option) => (
            <div
              key={option}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAnswer === option ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              onClick={() => setSelectedAnswer(option)}
            >
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="cursor-pointer flex-1">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Button
          onClick={submitAnswer}
          disabled={!selectedAnswer || isEvaluating}
          className="w-full"
          size="lg"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Grading...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
