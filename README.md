# Radical Master: Chinese Practice

Radical Master is an interactive Chinese character learning application designed to help users master Chinese radicals and numbers through a gamified quiz interface.

## Features

- **Multiple Game Modes**:
  - **Endless Mode**: Practice with a wide range of common Chinese radicals.
  - **Focus Mode**: Master a small, randomly selected set of 5 characters at a time.
  - **Numbers Mode**: Learn and practice Chinese digits from 0 to 10.
  - **Custom Mode**: Input any Chinese characters you want to learn. The app uses AI to fetch their Pinyin and meanings automatically.
- **AI-Powered Learning**: Integrates with Google's Gemini API to dynamically provide information for any Chinese character you provide.
- **Audio Pronunciation**: Uses built-in speech synthesis to provide Mandarin Chinese pronunciation for every character.
- **Progress Tracking**: Keep track of your score and current streak to stay motivated.
- **Interactive Tutor**: A friendly animal avatar guides you through your learning journey with encouraging messages.

## How It Works

- **React & TypeScript**: The application is built using React for a responsive UI and TypeScript for robust type safety.
- **Tailwind CSS**: Modern, utility-first styling for a clean and accessible interface.
- **Gemini API Integration**: When using Custom Mode, the app sends a request to the Gemini API (`gemini-3-flash-preview`) to retrieve accurate Pinyin and English meanings for the characters you input.
- **Web Speech API**: Pronunciation is handled via the browser's native `speechSynthesis` API, configured for Mandarin Chinese (`zh-CN`).
- **Data Management**: Core radicals and numbers are stored locally in `data.ts` for instant access, while custom characters are fetched on-demand.

## Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the app**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Technologies Used

- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini API (@google/genai)
- **Build Tool**: Vite
