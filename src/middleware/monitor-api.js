const { CustomError } = require("../utils/errors/error");
exports.monitor_api = (req, res, next) => {
  try {
    const TIMEOUT_DURATION = 60000; 
    const startTime = Date.now();
    let isTimeout = false;


    // Set a timeout to check if the request takes too long to complete
    const timeout = setTimeout(() => {
      isTimeout = true;
      console.error(
        "\x1b[31m%s\x1b[0m",
        `[user][${new Date().toISOString()}] ${req.method} ${
          req.originalUrl
        } - Request timed out`
      );
      //   res.status(408).send("Request Timeout");
    }, TIMEOUT_DURATION);

    // Log the end of the request when response is finished
    res.on("finish", () => {
      if (!isTimeout) {
        clearTimeout(timeout); // Clear the timeout if the request completes within the specified time
        const duration = Date.now() - startTime;
        console.log('\x1b[34m%s\x1b[0m',
          `[user][${new Date().toISOString()}] ${req.method} ${
            req.originalUrl
          } - Request completed in ${duration}ms`
        );
      }
    });

    // Handle any errors during the request
    res.on("close", () => {
      if (!isTimeout && !res.finished) {
        clearTimeout(timeout); // Clear the timeout if the request completes with an error
        console.error(
          `[user][${new Date().toISOString()}] ${req.method} ${
            req.originalUrl
          } - Request terminated prematurely`
        );
      }
    });

    next();
  } catch (error) {
    console.log("Some thing wrong on monitory API - (middleware)", error);

    return next(
      new CustomError(
        error.message || "Some thing wrong on monitory API - (middleware)",
        error.code || 500
      )
    );
  }
};
