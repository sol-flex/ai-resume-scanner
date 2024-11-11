document.getElementById('submit-btn').addEventListener('click', async () => {

    const PROD_URL = "https://ai-resume-scanner-sae2.onrender.com"
    const DEV_URL = "http://localhost:3005"

    const resume = document.getElementById('resume').files[0];
    const jobDescriptionText = document.getElementById('job-description').value;

    if (!resume || !jobDescriptionText) {
        alert('Please fill in both fields.');
        return;
    }

    const formData = new FormData();
    formData.append('resume', resume); // File input
    formData.append('jobDescription', jobDescriptionText); // Text input


    // Hide input section and show result section
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'flex';


    const pdfUrl = URL.createObjectURL(resume);
    const pdfViewer = document.getElementById('pdf-viewer')

    pdfViewer.src = pdfUrl;

    // Call the OpenAI API to get the results
    const response = await fetch(`${PROD_URL}/analyze`, { // Replace with your backend endpoint
        method: 'POST',
        body: formData
    });

    console.log(response)

    const data = await response.json();
    console.log(data);
    const output = JSON.parse(data.response.choices[0].message.content); // Adjust according to your API response structure

    const blob = new Blob([new Uint8Array(atob(data.file).split("").map(char => char.charCodeAt(0)))], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Set the download link's href
    const downloadLink = document.getElementById("downloadLink");
    downloadLink.href = url;

    // Optionally specify a default file name
    downloadLink.download = "Improved_Resume.docx";  // The name of the file

    // Show the download section
    document.getElementById("downloadSection").style.display = "block";

    const outputDisplay = document.getElementById('output-display');


    for (const [key, items] of Object.entries(output)) {
        // Create an h1 element for the key
        const h1 = document.createElement('h1');
        h1.textContent = key;

        // Append the h1 to the output-display div
        outputDisplay.appendChild(h1);

        // Create a <p> element for each item in the array
        items.forEach(item => {
            const p = document.createElement('p');
            p.textContent = item;
            outputDisplay.appendChild(p);
        });
    }
});
