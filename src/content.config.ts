import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    domain: z.string(),
    status: z.string(),
    statusDetail: z.string(),
    live: z.boolean().default(false),
    stack: z.array(z.string()),
    demo: z.string().url().optional(),
    repo: z.string().url().optional(),
    video: z.string().optional(),
    poster: z.string().optional(),
    videoAlt: z.string().optional(),
    summary: z.string(),
    order: z.number(),
    dark: z.boolean().default(false),
  }),
});

export const collections = { projects };
