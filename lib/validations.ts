import { z } from "zod";

// Days per month (non-leap for Feb — we'll be conservative)
const MONTH_DAYS: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

export const EventTypeEnum = z.enum(["BIRTHDAY", "ANNIVERSARY", "CEREMONY", "CUSTOM"]);

export const submitEventSchema = z
  .object({
    submitterName: z.string().min(1).max(80).trim(),
    eventType: EventTypeEnum,
    title: z.string().max(120).trim().optional(),
    note: z.string().max(300).trim().optional(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    isRecurring: z.boolean().default(true),
    idempotencyKey: z.string().uuid(),
    imageUrl: z.string().url().optional().nullable(),
    imagePublicId: z.string().optional().nullable(),
  })
  .refine(
    (d) => d.day <= (MONTH_DAYS[d.month] ?? 31),
    { message: "Invalid day for the selected month", path: ["day"] },
  )
  .refine(
    (d) =>
      d.eventType !== "CUSTOM" || (d.title !== undefined && d.title.length > 0),
    { message: "Custom events require a title", path: ["title"] },
  );

export type SubmitEventInput = z.infer<typeof submitEventSchema>;
export type EventType = z.infer<typeof EventTypeEnum>;

export const deleteEventSchema = z.object({
  id: z.string().cuid(),
});
