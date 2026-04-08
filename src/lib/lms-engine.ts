import { sql } from "./db";

export interface Lesson {
  id?: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
}

export interface CourseModule {
  id?: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  modules: CourseModule[];
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  completed_lessons: string[];
  created_at: string;
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  svg: string;
  issued_at: string;
}

let initialized = false;
async function ensureTables(): Promise<void> {
  if (initialized) return;
  await sql`CREATE TABLE IF NOT EXISTS courses (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    modules jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS enrollments (
    id text PRIMARY KEY,
    course_id text NOT NULL,
    student_id text NOT NULL,
    completed_lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS certificates (
    id text PRIMARY KEY,
    enrollment_id text NOT NULL,
    svg text NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now()
  )`;
  initialized = true;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function withIds(modules: CourseModule[]): CourseModule[] {
  return modules.map((m) => ({
    id: m.id ?? genId("mod"),
    title: m.title,
    lessons: m.lessons.map((l) => ({
      id: l.id ?? genId("les"),
      title: l.title,
      content: l.content,
      videoUrl: l.videoUrl,
      duration: l.duration,
    })),
  }));
}

export interface CreateCourseInput {
  userId: string;
  title: string;
  description: string;
  modules: CourseModule[];
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  await ensureTables();
  const id = genId("crs");
  const modules = withIds(input.modules);
  const rows = (await sql`INSERT INTO courses (id, user_id, title, description, modules)
    VALUES (${id}, ${input.userId}, ${input.title}, ${input.description}, ${JSON.stringify(modules)}::jsonb)
    RETURNING id, user_id, title, description, modules, created_at`) as Array<{
    id: string;
    user_id: string;
    title: string;
    description: string;
    modules: CourseModule[];
    created_at: string;
  }>;
  const r = rows[0];
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    modules: r.modules,
    created_at: r.created_at,
  };
}

export async function enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
  await ensureTables();
  const id = genId("enr");
  const rows = (await sql`INSERT INTO enrollments (id, course_id, student_id)
    VALUES (${id}, ${courseId}, ${studentId})
    RETURNING id, course_id, student_id, completed_lessons, created_at`) as Array<{
    id: string;
    course_id: string;
    student_id: string;
    completed_lessons: string[];
    created_at: string;
  }>;
  const r = rows[0];
  return {
    id: r.id,
    course_id: r.course_id,
    student_id: r.student_id,
    completed_lessons: r.completed_lessons,
    created_at: r.created_at,
  };
}

async function getEnrollment(enrollmentId: string): Promise<Enrollment | null> {
  const rows = (await sql`SELECT id, course_id, student_id, completed_lessons, created_at
    FROM enrollments WHERE id = ${enrollmentId}`) as Array<{
    id: string;
    course_id: string;
    student_id: string;
    completed_lessons: string[];
    created_at: string;
  }>;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    course_id: r.course_id,
    student_id: r.student_id,
    completed_lessons: r.completed_lessons,
    created_at: r.created_at,
  };
}

async function getCourse(courseId: string): Promise<Course | null> {
  const rows = (await sql`SELECT id, user_id, title, description, modules, created_at
    FROM courses WHERE id = ${courseId}`) as Array<{
    id: string;
    user_id: string;
    title: string;
    description: string;
    modules: CourseModule[];
    created_at: string;
  }>;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    modules: r.modules,
    created_at: r.created_at,
  };
}

export async function markLessonComplete(enrollmentId: string, lessonId: string): Promise<Enrollment> {
  await ensureTables();
  const enr = await getEnrollment(enrollmentId);
  if (!enr) throw new Error("Enrollment not found");
  const set = new Set<string>(enr.completed_lessons);
  set.add(lessonId);
  const next = Array.from(set);
  await sql`UPDATE enrollments SET completed_lessons = ${JSON.stringify(next)}::jsonb
    WHERE id = ${enrollmentId}`;
  return { ...enr, completed_lessons: next };
}

export interface CourseProgress {
  enrollmentId: string;
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  complete: boolean;
}

export async function courseProgress(enrollmentId: string): Promise<CourseProgress> {
  await ensureTables();
  const enr = await getEnrollment(enrollmentId);
  if (!enr) throw new Error("Enrollment not found");
  const course = await getCourse(enr.course_id);
  if (!course) throw new Error("Course not found");
  const total = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const allLessonIds = new Set<string>();
  for (const m of course.modules) for (const l of m.lessons) if (l.id) allLessonIds.add(l.id);
  const done = enr.completed_lessons.filter((id) => allLessonIds.has(id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return {
    enrollmentId,
    courseId: course.id,
    totalLessons: total,
    completedLessons: done,
    percent,
    complete: total > 0 && done === total,
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildCertificateSvg(courseTitle: string, studentId: string, issued: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="700" fill="url(#bg)"/>
  <rect x="40" y="40" width="920" height="620" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <text x="500" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="56" fill="url(#gold)">Certificate of Completion</text>
  <text x="500" y="280" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#cbd5e1">This certifies that</text>
  <text x="500" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#ffffff">${escapeXml(studentId)}</text>
  <text x="500" y="420" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#cbd5e1">has successfully completed</text>
  <text x="500" y="480" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="url(#gold)">${escapeXml(courseTitle)}</text>
  <text x="500" y="600" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#94a3b8">Issued ${escapeXml(issued)} - Zoobicon LMS</text>
</svg>`;
}

export async function issueCertificate(enrollmentId: string): Promise<Certificate> {
  await ensureTables();
  const progress = await courseProgress(enrollmentId);
  if (!progress.complete) throw new Error("Course not yet complete");
  const enr = await getEnrollment(enrollmentId);
  if (!enr) throw new Error("Enrollment not found");
  const course = await getCourse(enr.course_id);
  if (!course) throw new Error("Course not found");
  const issuedAt = new Date().toISOString();
  const svg = buildCertificateSvg(course.title, enr.student_id, issuedAt.slice(0, 10));
  const id = genId("cert");
  const rows = (await sql`INSERT INTO certificates (id, enrollment_id, svg, issued_at)
    VALUES (${id}, ${enrollmentId}, ${svg}, ${issuedAt})
    RETURNING id, enrollment_id, svg, issued_at`) as Array<{
    id: string;
    enrollment_id: string;
    svg: string;
    issued_at: string;
  }>;
  const r = rows[0];
  return {
    id: r.id,
    enrollment_id: r.enrollment_id,
    svg: r.svg,
    issued_at: r.issued_at,
  };
}

export interface GenerateCourseInput {
  topic: string;
  level: string;
}

export interface GeneratedCourseScaffold {
  title: string;
  description: string;
  modules: CourseModule[];
}

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicMessageResponse {
  content: AnthropicTextBlock[];
}

export async function generateCourse(input: GenerateCourseInput): Promise<GeneratedCourseScaffold> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const AnthropicMod = await import("@anthropic-ai/sdk");
  const Anthropic = AnthropicMod.default;
  const client = new Anthropic({ apiKey });
  const prompt = `Generate a complete course scaffold on "${input.topic}" at ${input.level} level.
Return ONLY valid JSON matching this TypeScript type:
{ "title": string, "description": string, "modules": [{ "title": string, "lessons": [{ "title": string, "content": string, "duration": number }] }] }
Include 4-6 modules, each with 3-5 lessons. Duration is in minutes. No markdown, no code fences, JSON only.`;
  const resp = (await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  })) as unknown as AnthropicMessageResponse;
  const text = resp.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as GeneratedCourseScaffold;
  return {
    title: String(parsed.title),
    description: String(parsed.description),
    modules: withIds(parsed.modules),
  };
}
