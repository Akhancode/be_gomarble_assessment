# SummariGenius

## Objective

Develop an API server capable of extracting reviews information from any given product page (e.g., Shopify, Amazon). The API should dynamically identify CSS elements of reviews and handle pagination to retrieve all reviews.


<a href="https://summarigenius.streamlit.app/">
</br>
  <img src="https://static1.smartbear.co/swagger/media/assets/images/swagger_logo.svg" alt="Streamlit App" width="200"/>
</a>


</br>

The API documentation, including in Swagger docs, is available at http://localhost:9000/api-docs
Redirect to there for API details, testing endpoints .  </br>
[Deployed server api doc ](http://gomarble-assessment.centralindia.cloudapp.azure.com/api-docs).

![SummarizeX Demo](demo.gif)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)


## Introduction

>This Node.js project utilizes Puppeteer for scraping review content from given product review URLs. Pagination is handled with custom logic and Gemini 1.5 Flash model (LLM) is used to dynamically detect CSS selectors for the required elements using a specific prompt. Two versions of the scraping process were implemented: one using CSS selectors and another utilizing the LLM to scrape the HTML block of review lists, filtered by selector detection.
Additionally, an optional multi-process handling feature is integrated using Node.js child processes to optimize scraping performance. API documentation is provided via Swagger, and an interactive frontend UI is built with React.js. Both the backend and frontend are successfully deployed on Azure.

## Features

- Input field for OpenAI API key.
- Text area to enter content or topics for summarization.
- Generate summarized content with a click of a button.

## Installation

- To run SummariGenius locally, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/codewithriza/SummariGenius/
 
    ```
1. Go to the file:

    ```bash
    cd SummariGenius
    ```
2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```
3. Run the application:

    ```bash
    streamlit run app.py
    ```

## Usage

After following the installation steps, open your browser and navigate to `localhost:8501` to access the SummarizeX application. Enter your OpenAI API key and the content or topic you want summarized. Click the "Generate Summary" button to get the summarized content.

## API Reference

This project utilizes the OpenAI GPT-3 API for text summarization. For more information on the OpenAI API and its usage, refer to the [OpenAI API documentation](https://beta.openai.com/docs/).

To get an API key for using the OpenAI API, you can [sign up here](https://platform.openai.com/api-keys).

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Streamlit](https://streamlit.io/)
- [OpenAI](https://openai.com/)

## Contact Me

If you have any questions, suggestions, or issues with the script, feel free to contact me.

---
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/840848369484169266)
[![X](https://img.shields.io/badge/X-%23000000.svg?style=for-the-badge&logo=X&logoColor=white)](https://twitter.com/f1ndkeys)


