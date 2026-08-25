import { z } from 'zod';

export const createPollSchema = z
  .object({
    question: z.string().trim().min(1).max(200),
    options: z
      .array(z.string().trim().min(1).max(120))
      .min(2)
      .max(5),
  })
  .refine(
    (data) => new Set(data.options).size === data.options.length,
    { message: 'options must be unique', path: ['options'] },
  );

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const voteSchema = z.object({
  optionIndex: z.number().int().min(0),
});

export const closeSchema = z.object({
  adminToken: z.string().min(1),
});
