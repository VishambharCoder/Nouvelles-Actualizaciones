# Nouvelles Actualizaciones - News Web Application

This is a responsive news web application that fetches and displays news from various RSS feeds. It includes features like category filtering, search, and an AI interaction modal (powered by Gemini API) to ask questions about articles.

## Deployment to GitHub Pages

This application is structured as a static site and can be deployed to GitHub Pages.

1.  **Create a GitHub Repository:**
    *   If you haven't already, create a new repository on GitHub.

2.  **Push Code:**
    *   Add your project files to the repository and push them.
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
        git push -u origin main
        ```

3.  **Configure GitHub Pages:**
    *   Go to your repository on GitHub.
    *   Click on **Settings**.
    *   In the left sidebar, click on **Pages** (under "Code and automation").
    *   Under "Build and deployment":
        *   For **Source**, select **Deploy from a branch**.
        *   For **Branch**, select `main` (or your default branch) and `/ (root)` folder.
    *   Click **Save**.
    *   GitHub will build and deploy your site. It might take a few minutes. The URL will be something like `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`.

## Important: API Key for AI Features

The AI Interaction Modal uses the Google Gemini API. The application is configured to retrieve the API key **exclusively** from the environment variable `process.env.API_KEY`.

**Limitation for GitHub Pages (Static Deployment):**
When you deploy this application as a static site directly to GitHub Pages, the `process.env.API_KEY` variable will **not** be available in the browser's JavaScript environment. This means the `apiKey` in `AiInteractionModal.tsx` will be `undefined`, and the **AI features will not function**. The application will display a notice in the AI modal indicating that the AI service is unavailable.

**Possible Solutions (Beyond Simple Static Deployment):**

*   **Backend Proxy:** The recommended and most secure way to handle API keys for client-side applications is to use a backend proxy. Your client-side app would make requests to your proxy, and the proxy would then securely add the API key and forward the request to the Gemini API. This keeps your API key off the client.
*   **Build Step Injection (Advanced):** If you were using a build tool (like Vite, Webpack, etc.), you could potentially use GitHub Actions to inject the API key (stored as a GitHub Secret) into your built JavaScript files during a CI/CD process. This current application structure does not include such a build step.

**Do NOT embed your API key directly into the client-side JavaScript code, as it will be publicly exposed.**

This application, as is, will deploy and function for news aggregation on GitHub Pages, but the AI interaction component will be non-operational due to the API key handling requirements and the nature of static site hosting.
