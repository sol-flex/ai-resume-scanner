// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const cors = require("cors");
const multer = require('multer');
const pdf = require('pdf-parse'); // Library for extracting text from PDFs
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const generateResumeDoc = require('./doctemplar.js')
require('dotenv').config();



// const loader = new PDFLoader("src/pdf/Learning_React_Modern_Patterns_for_Developing_React_Apps_by_Alex.pdf");

// const docs = await loader.load();


// Set up multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const apiKey = process.env.API_KEY;
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey });
const { z } = require("zod");

const { zodResponseFormat } = require("openai/helpers/zod");

// Zod schemas

const Output = z.object({
    "Score and Synopsis": z.array(z.string()),
    "Missing Keywords": z.array(z.string()),
    "Recommendations": z.array(z.string()),
    "Included Keywords": z.array(z.string()),
  });

    // Define the schema for a single work experience
    const ExperienceSchema = z.object({
        jobTitle: z.string(),
        company: z.string(),
        location: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string()
    });
    
    // Resume schema

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
        url: z.string(),
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

const port = 3005;

app.use(cors({
    origin: '*', // Allows requests from any origin (you can restrict this to specific domains if needed)
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type'
}));

// Middleware to parse JSON bodies
app.use(bodyParser.json());


const run = async (jobDescription, resume) => {

    const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: 
                `You are an AI assistant that helps improve resumes by matching them against job descriptions. 
                Provided with a job description and a resume, you have four tasks. 
                Task #1 is to find keywords in the job description that are missing from the resume. 
                Make sure not to miss any specific technologies, tools, or frameworks that are mentioned
                Task #2 is to provide a list of the keywords from the job description that have already been included in the resume. 
                Task #3 is to provide a list of suggestions as to how/where these missing keywords can be logically incorporated into the resume to best
                match the job description.
                Task #4 is to provide a general score out of 10 on how well the resume matches the job description and a synopsis
                of the strengths and weaknesses of the current resume and how it can be improved
                
                Again try your best to not miss any keywords. This is very important, especially keywords that describe 
                specific tools, software, or technilogies that are mentioned as qualifications for the job role`
            },
            {
                role: "user",
                content: `**Job Description:**
                            ${jobDescription}

                            **Resume:**
                            ${resume}

                            **Output:**
                            1. General score and synopsis
                            2. List of missing keywords.
                            3. Recommendations on where and how/where to include missing keywords in the resume.
                            4. List of keywords already included in resume`,
            },
        ],
        response_format: zodResponseFormat(Output, "math_response"),

    });
    
    console.log(completion.choices[0].message.content);
    return completion;
}

const improveResume = async (resume, analysis) => {

    const improvedResume = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: 
                `You are an expert in how candidates can get past recruiters ATS screens, which usually analyze resumes for matching keywords
                to the job description. Your task is as follows: You will be given a resume, the content of which has been parsed into a JSON object. The 
                JSON has different fields corresponding to different sections of the resume (i.e. experience, skills, personalInfo, etc.). Along with the resume
                with this you will be provided an experts analysis of how good the resume matches the current job description. Here you will find a list of key words that
                 are present in a job description but missing from the resume. 
                Your job will be to edit the content in the resume JSON. You won't change any of the fields but you will be able to edit the content by finding the most logical
                place to include the keywords based on the flow and structure of the original resume. Do this only by editing the existing text
                content and not adding additional structure to the JSON to the document.

                Return the entire edited resume JSON once you've finished your task. Don't add any text before or after it in your response. Don't say certainly
                or acknowledge the instructions. You will be given a structured JSON of a resume as input, and only return the edited JSON as output. The structure
                of the original JSON should not be changed, only the content.

                **input**
                resume in the form of a JSON object

                **missing key words**

                **output**
                Edited resume in the form of a JSON object
                
                `
            },
            {
                role: "user",
                content: `
                            **Resume:**
                            ${resume}

                            **analysis**
                            ${analysis}

                            **Output:**

                            `,
            },
        ],
        response_format: zodResponseFormat(ResumeSchema, "resume_schema"),

    });    
    console.log(improvedResume.choices[0].message)
    return improvedResume.choices[0].message.content;
}

const jsonifyResume = async (resume) => {

    const resumeJSON = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: 
                `You have a simple job. You are going to parse the resume provided "Resume" and return a structured
                 "Output" JSON object which conforms to the ResumeSchema JSON object schema. You will identify the 
                 key parts of the resume and place them correcly in the ResumeSchema 
                If there are sections in the resume which don't have corresponding keys in the ResumeSchema object
                then leave those fields as an empty string.
                
                `
            },
            {
                role: "user",
                content: `
                            **Resume:**
                            ${resume}

                            **Output:**

                            `,
            },
        ],
        response_format: zodResponseFormat(ResumeSchema, "resume_schema"),

    });    

    return resumeJSON.choices[0].message.content;
}

app.post('/analyze', upload.single('resume'), async (req, res) => {

    console.log(req.body)
    let { jobDescription  } = req.body;

    let resume = req.file;

    const resumeData = await pdf(resume.buffer);
    const resumeText = resumeData.text; // Get the extracted text
    console.log(resumeText)

    let resumeJSON = await jsonifyResume(resumeText);

    let response = await run(jobDescription, resumeText);

    let improvedResume = await improveResume(resumeJSON, response.choices[0].message.content)

    let docxBuffer = generateResumeDoc(JSON.parse(improvedResume));

    console.log("Response: ", response)

    console.log("Resume JSON: ", resumeJSON);

    console.log("Improved resume: ", JSON.parse(improvedResume))

    try {
        res.json({
            success: true,
            message: "Resume improved successfully",
            file: docxBuffer.toString('base64'), // Send the DOCX file as a base64 string
            response: response
        });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(error.response ? error.response.status : 500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
