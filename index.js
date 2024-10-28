// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const cors = require("cors");
const multer = require('multer');
const pdf = require('pdf-parse'); // Library for extracting text from PDFs
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
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

const Output = z.object({
    "Score and Synopsis": z.array(z.string()),
    "Missing Keywords": z.array(z.string()),
    "Recommendations": z.array(z.string()),
    "Included Keywords": z.array(z.string()),
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
                of the strengths and weaknesses of the current resume and how it can be improved`
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

app.post('/analyze', upload.single('resume'), async (req, res) => {

    console.log(req.body)
    let { jobDescription  } = req.body;

    let resume = req.file;

    const resumeData = await pdf(resume.buffer);
    const resumeText = resumeData.text; // Get the extracted text
    console.log(resumeText)

    let response = await run(jobDescription, resumeText);

    console.log(response)

    console.log(resume);

    try {
        res.json(response);
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
