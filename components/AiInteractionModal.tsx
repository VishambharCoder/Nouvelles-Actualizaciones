import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

interface AiInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: NewsItem;
}

const AiInteractionModal: React.FC<AiInteractionModalProps> = ({ isOpen, onClose, newsItem }) => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safely attempt to get API_KEY. In a browser without a build process, process.env will not exist.
  // The CI/CD pipeline (if used) would typically replace a placeholder or set this via other means.
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : undefined;

  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    // This warning is for developers during development or if the key is missing in a deployed environment.
    // The UI will also inform the user if AI features are unavailable.
    console.warn("API_KEY for GoogleGenAI is not set or accessible. AI features will be disabled.");
  }

  useEffect(() => {
    // Reset state when modal opens for a new item or closes
    if (isOpen) {
      setQuestion('');
      setAnswer('');
      setError(null);
    }
  }, [isOpen, newsItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ai) {
      setError("AI service is not available. This might be due to a missing API key configuration or the key not being accessible.");
      return;
    }
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setAnswer('');
    setError(null);

    const prompt = `Based on the following news article snippet:\n\nTitle: "${newsItem.title}"\nDescription: "${newsItem.description}"\n\nAnswer this question: ${question}\n\nAnswer:`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            temperature: 0.5, 
            topK: 32,
            topP: 0.9,
            // thinkingConfig: { thinkingBudget: 0 } // For lower latency if needed, but higher quality if omitted
        }
      });
      
      let textResponse = response.text;
      textResponse = textResponse.replace(/```(markdown)?\s?/gi, '').replace(/```\s?$/gi, '').trim();

      setAnswer(textResponse);
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching the AI response.");
      setAnswer('');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-100"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ask AI about this News</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
            <p className="font-medium text-gray-700 dark:text-gray-300">Article: <span className="font-normal">{newsItem.title}</span></p>
        </div>

        {!apiKey && (
             <div className="bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-100 p-4 mb-4 rounded-md" role="alert">
                <p className="font-bold">AI Feature Notice</p>
                <p>The AI interaction feature requires an API key which is not currently configured or accessible in this environment. Please refer to the deployment documentation if you are the site administrator.</p>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
            disabled={isLoading || !apiKey}
            aria-label="Your question about the article"
          />
          <button 
            type="submit" 
            disabled={isLoading || !question.trim() || !apiKey}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>

        {error && <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-600 rounded-md mb-3" role="alert">{error}</div>}
        
        {answer && (
          <div className="mt-1 flex-grow overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h3 className="font-semibold mb-1.5 text-gray-800 dark:text-gray-200">AI's Answer:</h3>
            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiInteractionModal;