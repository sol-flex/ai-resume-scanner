const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

const processPDF = async () => {
    const loader = new PDFLoader("src/pdf/resume-test.pdf");

    const docs = await loader.load();
    
    console.log(docs);
}

processPDF();