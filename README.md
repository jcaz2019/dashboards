# Dashboards

This project consists of a frontend React application and a backend Node.js server for displaying and managing dashboards.

## Project Structure

- `/frontend` - React application built with TypeScript
- `/backend` - Node.js server with TypeScript

## Getting Started

### Prerequisites

- Node.js (version 14.x or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/YourUsername/dashboards.git
   cd dashboards
   ```

2. Install dependencies for backend
   ```
   cd backend
   npm install
   ```

3. Install dependencies for frontend
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

#### Backend

```
cd backend
npm run dev
```

The backend server will start on the configured port (check .env file).

#### Frontend

```
cd frontend
npm start
```

The frontend development server will start on http://localhost:3000.

## Development

- Frontend is bootstrapped with Create React App
- Backend uses Express.js framework

## Building for Production

### Frontend

```
cd frontend
npm run build
```

### Backend

```
cd backend
npm run build
```

## Additional Information

For more detailed information about the frontend setup, see the Create React App documentation:
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/) 