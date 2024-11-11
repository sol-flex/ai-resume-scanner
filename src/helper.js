

export function extractTextFromPDF(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const pdfData = new Uint8Array(event.target.result);

        pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
            let text = '';
            const totalPages = pdf.numPages;

            const textPromises = [];
            for (let i = 1; i <= totalPages; i++) {
                textPromises.push(
                    pdf.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(textContent) {
                            textContent.items.forEach(item => {
                                text += item.str + ' ';
                            });
                        });
                    })
                );
            }

            // Wait for all pages to be processed
            Promise.all(textPromises).then(function() {
                displayOutput(text);
            });
        }).catch(function(error) {
            console.error('Error during PDF processing:', error);
        });
    };
    reader.readAsArrayBuffer(file);
}

function displayOutput(text) {
    document.getElementById('output').innerText = text;
}
