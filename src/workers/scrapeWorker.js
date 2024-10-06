const { scrapePage } = require("../services/review.service");



// Get the URL from the parent process (passed as an argument)
const url = process.argv[2];


scrapePage(url)
    .then((data) => {
        // Send the data back to the parent process
        process.send({ url, data });
        process.exit(0); // Exit after scraping
    })
    .catch((error) => {
        process.send({ error: error.message });
        process.exit(1); // Exit with error
    });
