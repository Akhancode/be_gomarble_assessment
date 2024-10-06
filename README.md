# SummariGenius

## Objective

Develop an API server capable of extracting reviews information from any given product page (e.g., Shopify, Amazon). The API should dynamically identify CSS elements of reviews and handle pagination to retrieve all reviews.


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

- Scrapping reviews from product review page [required product review page ]
- Gemini 1.5 Flash model (LLM) is used to dynamically detect CSS selectors
- Two versions of the scraping process [v1 and v2]
- Pagination is handled with custom logic
- Optional Feauture - Multi-process handling feature is integrated using Node.js child processes.
- Interactive UI built with React.js
- Deployed Backend and made CI-CD by utilizing github actions .

## Installation

- To run Project locally, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/Akhancode/be_gomarble_assessment.git
 
    ```
1. Go to the file:

    ```bash
    cd be_gomarble_assessment
    ```
2. Install dependencies:

    ```bash
    npm install 
    ```
3. Optional - if chrome doesnt exist please install dependency:

    ```bash
    npx puppeteer browsers install chrome
    ```
4. create a .env in root folder and paste variable :

    Get the Backend env secrets from  [here](https://drive.google.com/file/d/1I9onZH3cmeFcaOsPis1-FQkp-g6rguvL/view?usp=sharing). Kindly paste accordingly.
     
4. Run the application:

    ```bash
    npm start
    ```

## Usage

After following the installation steps, open your browser and navigate to `localhost:8501` to access the SummarizeX application. Enter your OpenAI API key and the content or topic you want summarized. Click the "Generate Summary" button to get the summarized content.

## API Reference

<a href="https://summarigenius.streamlit.app/">
</br>
  <img src="https://static1.smartbear.co/swagger/media/assets/images/swagger_logo.svg" alt="Streamlit App" width="200"/>
</a>
</br>
The API documentation, including in Swagger docs, is available at 


Redirect to there for API details, testing endpoints .  </br>


- Deployed api  [Deployed server api doc ](http://gomarble-assessment.centralindia.cloudapp.azure.com/api-docs).

- Localhost api  [http://localhost:9000/api-docs](http://localhost:9000/api-docs)





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


