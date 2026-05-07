/**
 * AI 응답 구조 타입.
 *
 * AI 가 JSON 으로 응답한 결과를 zod 로 검증한 뒤 사용한다.
 */
import { z } from "zod";

export const dailyFortuneAiSchema = z.object({
  score: z.number().int().min(1).max(100),
  title: z.string().min(1).max(60),
  content: z.string().min(1).max(2000),
  luckyColor: z.string().min(1).max(20),
  luckyNumber: z.number().int().min(1).max(99),
  luckyDirection: z.string().min(1).max(20),
});

export type DailyFortuneAiOutput = z.infer<typeof dailyFortuneAiSchema>;

export const tarotSingleAiSchema = z.object({
  interpretation: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
});

export type TarotSingleAiOutput = z.infer<typeof tarotSingleAiSchema>;

export const tarotThreeAiSchema = z.object({
  past: z.string().min(1).max(2000),
  present: z.string().min(1).max(2000),
  future: z.string().min(1).max(2000),
  synthesis: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
});

export type TarotThreeAiOutput = z.infer<typeof tarotThreeAiSchema>;

export const compatibilityAiSchema = z.object({
  score: z.number().int().min(1).max(100),
  summary: z.string().min(1).max(80),
  detail: z.string().min(1).max(2500),
});

export type CompatibilityAiOutput = z.infer<typeof compatibilityAiSchema>;

export const sajuDeepAiSchema = z.object({
  personality: z.string().min(1).max(2000),
  strengths: z.string().min(1).max(2000),
  cautions: z.string().min(1).max(2000),
  loveStyle: z.string().min(1).max(2000),
  careerFit: z.string().min(1).max(2000),
  healthCare: z.string().min(1).max(2000),
  lifeFlow: z.string().min(1).max(3000),
});

export type SajuDeepAiOutput = z.infer<typeof sajuDeepAiSchema>;
