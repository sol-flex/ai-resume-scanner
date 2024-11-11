import { z } from 'zod';

// Define the schema for a single work experience
const ExperienceSchema = z.object({
    jobTitle: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string()
  });
  
  // Define the schema for Education section
  const EducationSchema = z.object({
    degree: z.string(),
    institution: z.string(),
    location: z.string(),
    startDate: z.string(),
    graduationYear: z.string()
  });
  
  // Define the schema for skills
  const SkillsSchema = z.string();

  const ProjectSchema = z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    startDate: z.string(),
    endDate: z.string()
  });

  const ResumeSchema = z.object({
    personalInfo: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      address: z.string(),
      linkedin: z.string(),
      github: z.string(),
    }),
    professionalSummary: z.string(),
    skills: SkillsSchema,
    experience: z.array(ExperienceSchema),
    education: z.array(EducationSchema),
    certifications: z.array(z.string()),
    languages: z.string(),
    projects: z.array(ProjectSchema)
  });

  module.exports = ResumeSchema;