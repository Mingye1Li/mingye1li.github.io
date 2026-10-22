import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    tags: z.array(z.string()).default([]), categories: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(), description: z.string(), year: z.number(),
    tags: z.array(z.string()).default([]), featured: z.boolean().default(false),
    github: z.url().optional(), live: z.string().optional(),
  }),
});
const translatedBlog = defineCollection({
  loader: glob({pattern:'*/blog/**/*.{md,mdx}',base:'./src/content/translations'}),
  schema: z.object({title:z.string(),description:z.string(),date:z.coerce.date(),tags:z.array(z.string()).default([]),categories:z.array(z.string()).default([]),draft:z.boolean().default(false)}),
});
const translatedPortfolio = defineCollection({
  loader: glob({pattern:'*/portfolio/*.{md,mdx}',base:'./src/content/translations'}),
  schema: z.object({title:z.string(),description:z.string(),year:z.number(),tags:z.array(z.string()).default([]),featured:z.boolean().default(false),github:z.url().optional(),live:z.string().optional()}),
});
export const collections = { blog, portfolio, translatedBlog, translatedPortfolio };
