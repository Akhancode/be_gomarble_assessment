const { scrapePage } = require("../services/review.service");



// Get the URL and query scrapebyllm from the parent process (passed as an argument)
const url = process.argv[2];
const scrapeByLLM = process.argv[3];


scrapePage(url,scrapeByLLM)
    .then((data) => {
        // Send the data back to the parent process
        process.send(data);
        process.exit(0); 
    })
    .catch((error) => {
        process.send({ error: error.message });
        process.exit(1); 
    });
