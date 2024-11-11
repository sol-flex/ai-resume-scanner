// Load our library that generates the document
const Docxtemplater = require("docxtemplater");
// Load PizZip library to load the docx/pptx/xlsx file in memory
const PizZip = require("pizzip");


// Builtin file system utilities
const fs = require("fs");
const path = require("path");

const generateResumeDoc = (resumeJSON) => {

// Load the docx file as binary content
const content = fs.readFileSync(
    path.resolve(__dirname, "input.docx"),
    "binary"
);

// Unzip the content of the file
const zip = new PizZip(content);

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
});

doc.render({
    name: resumeJSON.personalInfo.name,
    email: resumeJSON.personalInfo.email,
    experience: resumeJSON.experience,
    education: resumeJSON.education,
    skills: resumeJSON.skills
});

// Get the document as a zip (docx are zipped files)
// and generate it as a Node.js buffer
const buf = doc.getZip().generate({
    type: "nodebuffer",
    // Compression: DEFLATE adds a compression step.
    // For a 50MB document, expect 500ms additional CPU time.
    compression: "DEFLATE",
});

// Write the Node.js Buffer to a file
fs.writeFileSync(path.resolve(__dirname, "output.docx"), buf);
// Instead of writing it to a file, you could also
// let the user download it, store it in a database,
// on AWS S3, ...
return buf;
}

module.exports = generateResumeDoc;