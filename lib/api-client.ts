// API Client for Academic Agent System
// Backend URLs from Streamlit Python files

const STUDENT_API_BASE_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL || "http://localhost:8000";
const TEACHER_API_BASE_URL = process.env.NEXT_PUBLIC_TEACHER_API_URL || "http://localhost:8001";

// Types
export interface Subject {
  subject_id: string;
  subject_name: string;
}

export interface Module {
  module_id: string;
  module_name: string;
  description?: string;
}

export interface Progress {
  module_id: string;
  status: "locked" | "unlocked" | "completed" | "in_progress";
  score?: number;
}

export interface Question {
  question_id?: string;
  question: string;
  options?: string[];
  correct_answer?: string;
  difficulty?: string;
  topic_id?: string;
  chapter?: string;
}

export interface EvaluationResult {
  feedback: string;
  is_correct: boolean;
}

export interface LearnResponse {
  response: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsData {
  overall_progress: number;
  average_score: number;
  completed_modules: number;
  module_breakdown: Array<{
    module_id: string;
    module_name?: string;
    score: number;
    status: string;
  }>;
  weak_areas?: string[];
}

export interface AnalyticsResponse {
  student_id: string;
  analytics: AnalyticsData;
  explanation: string;
}

export interface Unit {
  unit_id: string;
  unit_title: string;
  topics: Array<{
    topic_name: string;
    topic_id?: string;
  }>;
}

export interface CurriculumData {
  subject: string;
  grade: string;
  units: Unit[];
}

export interface LessonPlan {
  meta: {
    style?: string;
    why_this_structure?: string;
    teaching_level?: string;
    estimated_time_breakdown?: Record<string, string>;
  };
  timeline: Array<{
    type?: string;
    title: string;
    section?: string;
    duration?: string;
    duration_minutes?: number;
    reasoning?: string;
    co_mapping?: {
      codes: string[];
      source: string;
    };
    engagement?: Array<{
      engagement_type?: string;
      duration_minutes?: number;
      teacher_script?: string;
      student_action?: string;
      key_realization?: string;
      quick_check?: string;
    } | string>;
    items?: unknown[];
    content?: unknown[] | string;
    sections?: unknown[];
  }>;
}

export interface Student {
  student_id: string;
  name?: string;
}

export interface OverviewAnalytics {
  class_average: number;
  total_students: number;
  common_weak_areas?: Array<{
    module_name: string;
    cohort_average: number;
    students_attempted: number;
  }>;
  module_progress?: Array<{
    module: string;
    completed: number;
    in_progress: number;
  }>;
}

export interface PerformanceDistribution {
  "Needs Support (<50%)": number;
  "High Performers (>75%)": number;
  [key: string]: number;
}

export interface Leaderboard {
  top_5: Array<{ name: string; score: number }>;
  bottom_5: Array<{ name: string; score: number }>;
}

export interface ExamAnalytics {
  submitted_count: number;
  total_assigned: number;
  average_score: number;
  pass_rate?: number;
  student_details: Array<{
    name: string;
    score: number;
    status: string;
  }>;
}

export interface StudentDetail {
  average_score: number;
  overall_progress: number;
  modules: Array<{
    module_id: string;
    module_name?: string;
    score: number;
    status: string;
  }>;
  weak_areas?: Record<string, number>;
}

export interface CourseOutcome {
  co_id: string;
  co_code: string;
  description: string;
  subject_id: string;
}

export interface ProgramOutcome {
  po_id: string;
  title: string;
  description: string;
}

export interface ModuleCOMapping {
  module_id: string;
  co_id: string;
}

export interface COPOMapping {
  co_id: string;
  po_id: string;
  weight: number;
}

// ==================== STUDENT API CLIENT ====================
export const studentApi = {
  // Register student
  async registerStudent(studentId: string, subjectId: string, grade: string): Promise<void> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/student/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        subject_id: subjectId,
        grade: grade,
      }),
    });
    if (!res.ok) throw new Error(`Failed to register student: ${res.statusText}`);
  },

  // Get subjects by grade
  async getSubjectsByGrade(grade: string): Promise<Subject[]> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/curriculum/grade/${grade}/subjects`);
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    return res.json();
  },

  // Get modules for a subject
  async getModules(subjectId: string): Promise<Module[]> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/curriculum/${subjectId}/modules`);
    if (!res.ok) throw new Error(`Failed to fetch modules: ${res.statusText}`);
    return res.json();
  },

  // Get student progress
  async getProgress(studentId: string): Promise<Progress[]> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/student/${studentId}/progress`);
    if (!res.ok) throw new Error(`Failed to fetch progress: ${res.statusText}`);
    return res.json();
  },

  // Learn - chat with AI tutor
  async learn(
    studentId: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<LearnResponse> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/agent/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        message: message,
        context: context,
      }),
    });
    if (!res.ok) throw new Error(`Failed to learn: ${res.statusText}`);
    return res.json();
  },

  // Generate question
  async generateQuestion(
    studentId: string,
    moduleId: string,
    difficulty: string = "medium"
  ): Promise<Question> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/agent/question/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        module_id: moduleId,
        difficulty: difficulty,
      }),
    });
    if (!res.ok) throw new Error(`Failed to generate question: ${res.statusText}`);
    return res.json();
  },

  // Evaluate answer
  async evaluateAnswer(
    studentId: string,
    question: string,
    answer: string,
    questionId?: string
  ): Promise<EvaluationResult> {
    const payload: Record<string, unknown> = {
      student_id: studentId,
      question: question,
      answer: answer,
    };
    if (questionId) payload.question_id = questionId;

    const res = await fetch(`${STUDENT_API_BASE_URL}/agent/question/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to evaluate answer: ${res.statusText}`);
    return res.json();
  },

  // Record assessment
  async recordAssessment(
    studentId: string,
    moduleId: string,
    score: number,
    passed: boolean,
    attempts?: Array<{ question_id?: string; student_answer: string; is_correct: boolean }>
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      student_id: studentId,
      module_id: moduleId,
      score: score,
      passed: passed,
    };
    if (attempts) payload.attempts = attempts;

    const res = await fetch(`${STUDENT_API_BASE_URL}/student/assessment/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to record assessment: ${res.statusText}`);
  },

  // Get analytics
  async getAnalytics(studentId: string, subjectId?: string): Promise<AnalyticsResponse> {
    const url = new URL(`${STUDENT_API_BASE_URL}/student/analytics/${studentId}`);
    if (subjectId) url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    return res.json();
  },

  // Get final questions
  async getFinalQuestions(moduleId: string): Promise<Question[]> {
    const res = await fetch(
      `${STUDENT_API_BASE_URL}/student/assessment/final-questions/${moduleId}`
    );
    if (!res.ok) throw new Error(`Failed to fetch final questions: ${res.statusText}`);
    return res.json();
  },

  // Get topic details
  async getTopic(topicId: string): Promise<{ topic_name: string; topic_id: string }> {
    const res = await fetch(`${STUDENT_API_BASE_URL}/curriculum/topic/${topicId}`);
    if (!res.ok) throw new Error(`Failed to fetch topic: ${res.statusText}`);
    return res.json();
  },
};

// ==================== TEACHER API CLIENT ====================
export const teacherApi = {
  // Get subjects
  async getSubjects(): Promise<string[]> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/subjects`);
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    const data = await res.json();
    return data.subjects || [];
  },

  // Get curriculum
  async getCurriculum(subject: string, grade: string): Promise<{ units: Unit[] }> {
    const url = new URL(`${TEACHER_API_BASE_URL}/curriculum`);
    url.searchParams.set("subject", subject);
    url.searchParams.set("grade", grade);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch curriculum: ${res.statusText}`);
    return res.json();
  },

  // Generate lesson plan
  async generateLessonPlan(
    subject: string,
    grade: string,
    topic: string,
    teachingLevel: string,
    preference: string,
    moduleId?: string
  ): Promise<LessonPlan> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/lesson-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject,
        grade: grade,
        topic: topic,
        teaching_level: teachingLevel.toLowerCase(),
        teacher_preference: preference,
        module_id: moduleId,
      }),
    });
    if (!res.ok) throw new Error(`Failed to generate lesson plan: ${res.statusText}`);
    return res.json();
  },

  // Fetch chapter resources
  async getChapterResources(
    subject: string,
    grade: string,
    chapter: string
  ): Promise<{ subtopics: unknown[]; questions: Question[] }> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/chapter-resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject,
        grade: grade,
        chapter: chapter,
      }),
    });
    if (!res.ok) throw new Error(`Failed to fetch chapter resources: ${res.statusText}`);
    return res.json();
  },

  // Batch chapter resources
  async getBatchChapterResources(
    subject: string,
    grade: string,
    requests: Record<string, number>
  ): Promise<{ resources: Array<{ chapter: string; questions: Question[] }> }> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/batch-chapter-resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject,
        grade: grade,
        requests: requests,
      }),
    });
    if (!res.ok) throw new Error(`Failed to fetch batch resources: ${res.statusText}`);
    return res.json();
  },

  // Publish questions
  async publishQuestions(
    subject: string,
    grade: string,
    questions: Question[],
    replaceExisting: boolean = true
  ): Promise<{ message: string }> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/publish-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject,
        grade: grade,
        questions: questions,
        replace_existing: replaceExisting,
      }),
    });
    if (!res.ok) throw new Error(`Failed to publish questions: ${res.statusText}`);
    return res.json();
  },

  // ==================== ANALYTICS ====================
  async getOverview(subjectId?: string): Promise<OverviewAnalytics> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/overview`);
    if (subjectId) url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch overview: ${res.statusText}`);
    return res.json();
  },

  async getPerformanceDistribution(subjectId?: string): Promise<PerformanceDistribution> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/performance`);
    if (subjectId) url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch performance: ${res.statusText}`);
    return res.json();
  },

  async getCohortDistribution(subjectId?: string): Promise<Record<string, number>> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/cohort`);
    if (subjectId) url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch cohort: ${res.statusText}`);
    return res.json();
  },

  async getLeaderboard(subjectId?: string): Promise<Leaderboard> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/leaderboard`);
    if (subjectId) url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
    return res.json();
  },

  async getExamAnalytics(subjectId: string): Promise<ExamAnalytics> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/exam`);
    url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch exam analytics: ${res.statusText}`);
    return res.json();
  },

  async getInsights(subjectId: string): Promise<{ insight: string; data: unknown }> {
    const url = new URL(`${TEACHER_API_BASE_URL}/teacher/analytics/insights`);
    url.searchParams.set("subject_id", subjectId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch insights: ${res.statusText}`);
    return res.json();
  },

  async getStudents(): Promise<{ students: Student[] }> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/students`);
    if (!res.ok) throw new Error(`Failed to fetch students: ${res.statusText}`);
    return res.json();
  },

  async getStudentDetails(studentId: string): Promise<StudentDetail> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/teacher/analytics/student/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch student details: ${res.statusText}`);
    return res.json();
  },

  // ==================== OBE ENDPOINTS ====================
  async getCourseOutcomes(subjectId: string): Promise<CourseOutcome[]> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/cos/${subjectId}`);
    if (!res.ok) throw new Error(`Failed to fetch course outcomes: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async saveCourseOutcomes(subjectId: string, outcomes: CourseOutcome[]): Promise<void> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/cos/${subjectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomes }),
    });
    if (!res.ok) throw new Error(`Failed to save course outcomes: ${res.statusText}`);
  },

  async getProgramOutcomes(): Promise<ProgramOutcome[]> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/pos`);
    if (!res.ok) throw new Error(`Failed to fetch program outcomes: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async getModuleCOMappings(subjectId: string): Promise<ModuleCOMapping[]> {
    const url = new URL(`${TEACHER_API_BASE_URL}/obe/mappings/module-co`);
    // Streamlit implementation does NOT filter by subject_id, doing so might hide some modules (e.g. final exam)
    // if the backend association is loose.
    // url.searchParams.set("subject_id", subjectId); 

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch module mappings: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async getOBEModules(subjectId: string): Promise<string[]> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/modules/${subjectId}`);
    if (!res.ok) {
      console.warn(`Failed to fetch modules for ${subjectId}, using fallback.`);
      return ["DS-U1", "DS-U2", "DS-U3", "DS-Final"];
    }
    const data = await res.json();
    // API returns { data: [{ module_id: "..." }, ...] }
    return data.data.map((m: any) =>
      m.module_id === "btech_data_structures_y2_final_exam" ? "DS-Final" : m.module_id
    );
  },

  async autoSuggestCOMappings(subjectId: string): Promise<Record<string, string[]>> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/mappings/auto-suggest/${subjectId}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Failed to auto-suggest mappings: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async saveModuleCOMapping(moduleId: string, coIds: string[]): Promise<void> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/mappings/module-co`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: moduleId, co_ids: coIds }),
    });
    if (!res.ok) throw new Error(`Failed to save module mapping: ${res.statusText}`);
  },

  async getCOPOMappings(subjectId: string): Promise<COPOMapping[]> {
    const url = new URL(`${TEACHER_API_BASE_URL}/obe/mappings/co-po`);
    url.searchParams.set("subject_id", subjectId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch CO-PO mappings: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async saveCOPOMappings(mappings: COPOMapping[]): Promise<void> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/mappings/co-po`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappings }),
    });
    if (!res.ok) throw new Error(`Failed to save CO-PO mappings: ${res.statusText}`);
  },

  async getCOAttainment(subjectId: string): Promise<Record<string, { co_id: string; co_code: string; avg_attainment: number; student_count: number }>> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/analytics/attainment/co/${subjectId}`);
    if (!res.ok) throw new Error(`Failed to fetch CO attainment: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },

  async getPOAttainment(subjectId: string): Promise<Array<{ po_id: string; attainment: number }>> {
    const res = await fetch(`${TEACHER_API_BASE_URL}/obe/analytics/attainment/po/${subjectId}`);
    if (!res.ok) throw new Error(`Failed to fetch PO attainment: ${res.statusText}`);
    const data = await res.json();
    return data.data || data;
  },
};
