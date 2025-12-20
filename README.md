# Data Bucket UI

A beautiful frontend interface for the Data Bucket API built with Astro.js and React.

## Features

- Connect to your Data Bucket API instance
- Create and manage buckets
- View received webhook/request data in real-time
- Clear bucket data
- Delete buckets
- Beautiful, modern UI with smooth animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A running Data Bucket API instance

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:4321`

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

1. Enter your Data Bucket API URL (e.g., `http://localhost:8080`)
2. If your API has authentication enabled, enter your username and password
3. Click "Connect" to connect to your Data Bucket instance
4. Create buckets to start capturing webhook data
5. Share the bucket endpoint with services that need to send data

## API Connection

The UI connects to your Data Bucket API and requires:
- **API URL**: The base URL of your running Data Bucket service
- **Username**: (Optional) If authentication is enabled
- **Password**: (Optional) If authentication is enabled

The connection details are saved in localStorage for convenience.

## Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
