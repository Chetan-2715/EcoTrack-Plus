# EcoTrack+ - Environmental Habit Tracking Application

## Overview

EcoTrack+ is a full-stack web application designed to help users track their environmental habits and sustainable practices. The application gamifies eco-friendly behaviors by allowing users to log activities like recycling, sustainable transportation, energy saving, and water conservation. Users earn points for their actions, compete on leaderboards, and can claim rewards based on their accumulated points.

The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, all built with TypeScript for type safety throughout the entire codebase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript and follows a component-based architecture. Key design decisions include:

- **UI Framework**: Uses shadcn/ui components built on top of Radix UI primitives, providing consistent and accessible UI components
- **Styling**: Tailwind CSS for utility-first styling with custom CSS variables for theming, including eco-specific color schemes
- **State Management**: React Context API for authentication state management, with TanStack Query for server state management and caching
- **Routing**: Wouter library for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The server-side follows a RESTful API design with Express.js:

- **Framework**: Express.js with TypeScript for type-safe server development
- **API Design**: RESTful endpoints organized by feature (auth, users, habits, rewards, leaderboard)
- **Validation**: Zod schemas for request/response validation with shared types between client and server
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development**: Hot reload support with tsx for TypeScript execution

### Data Storage
The application uses a hybrid storage approach during development:

- **Database**: PostgreSQL as the primary database with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Development Storage**: In-memory storage implementation for rapid prototyping and testing
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

### Authentication and Authorization
Simple session-based authentication system:

- **Strategy**: Username/email and password authentication without external providers
- **Session Management**: User context maintained in React state
- **Data Protection**: User-specific data isolation through userId-based queries
- **Route Protection**: Client-side route guards redirecting unauthenticated users

### Component Architecture
The UI follows atomic design principles:

- **Base Components**: Reusable UI primitives in `/components/ui/`
- **Feature Components**: Domain-specific components like HabitCard for habit tracking
- **Page Components**: Route-level components in `/pages/`
- **Layout Components**: Navigation and layout components for consistent user experience

### Development Workflow
The project structure supports efficient development:

- **Monorepo Structure**: Shared types and schemas between client and server in `/shared/`
- **Path Aliases**: TypeScript path mapping for clean imports (`@/`, `@shared/`)
- **Development Server**: Vite dev server with Express API proxy for seamless full-stack development
- **Type Safety**: End-to-end TypeScript with shared validation schemas

## External Dependencies

### UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives for building the interface
- **tailwindcss**: Utility-first CSS framework for responsive design
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library for consistent iconography throughout the application

### Database and ORM
- **drizzle-orm**: Type-safe ORM for PostgreSQL database operations
- **drizzle-kit**: Database migration and schema management tools
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud deployment
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### State Management and Data Fetching
- **@tanstack/react-query**: Server state management with caching, background updates, and optimistic updates
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration with Zod for form validation

### Development and Build Tools
- **vite**: Fast build tool with hot module replacement for development
- **tsx**: TypeScript execution environment for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for better debugging experience

### Validation and Type Safety
- **zod**: Schema validation library used across client and server
- **zod-validation-error**: Better error messages from Zod validation failures

### Date and Time
- **date-fns**: Lightweight date utility library for date formatting and manipulation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (prepared for future session-based auth)

### Utilities
- **clsx**: Conditional class name utility
- **nanoid**: URL-safe unique ID generator
- **wouter**: Minimalist routing library for React applications