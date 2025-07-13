# WeightWise - Smart Weight Tracking Application

## Overview

WeightWise is a full-stack web application for tracking weight progress with AI-powered image recognition capabilities. The application allows users to manually log weight entries or upload scale images for automatic weight detection using mock OCR processing. It provides comprehensive analytics, charts, and activity tracking to help users monitor their fitness journey.

## Recent Changes

- **July 13, 2025**: Corrected application focus back to weight tracking after temporarily becoming a business recommendation system
- Fixed database schema to include weight_entries table instead of business-related tables
- Updated frontend to display weight tracking functionality with charts and entry management
- Implemented photo upload with mock OCR for automatic weight detection
- Added comprehensive weight tracking features including manual entry, photo upload, deletion, and progress visualization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js for weight progress visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Database Design
The application uses a PostgreSQL database with the following key tables:
- **sessions**: Required for Replit Auth session management
- **users**: User profiles with Replit Auth integration
- **weight_entries**: Weight records with support for manual and photo entries
- **activity_logs**: Audit trail for user actions

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication using connect-pg-simple
- Protected routes requiring authentication
- User profile management

### Weight Tracking Features
- Manual weight entry with unit selection (lbs/kg)
- Photo upload with mock OCR processing for automatic weight detection
- Weight history with chronological listing
- Data visualization with interactive charts
- Weight statistics including current weight, weekly averages, and trends

### File Upload System
- Multer-based file handling for scale images
- Image validation (type and size limits)
- Mock OCR processing that simulates weight detection
- File storage in local uploads directory

### Activity Logging
- Comprehensive audit trail for user actions
- Automatic logging of weight entries, uploads, and deletions
- Activity history display with timestamps

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating sessions stored in PostgreSQL
2. **Weight Entry**: Users can either manually enter weight or upload scale images
3. **Image Processing**: Uploaded images are processed through mock OCR to extract weight values
4. **Data Storage**: All weight entries and activities are stored in PostgreSQL via Drizzle ORM
5. **Analytics**: Frontend queries weight data to generate charts and statistics
6. **Real-time Updates**: TanStack Query manages cache invalidation for immediate UI updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **@radix-ui/***: Headless UI components for accessibility
- **@tanstack/react-query**: Server state management
- **chart.js**: Data visualization
- **drizzle-orm**: Type-safe database operations
- **multer**: File upload handling

### Authentication
- **openid-client**: OpenID Connect integration for Replit Auth
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory via Vite
- Backend bundles to `dist/index.js` via esbuild
- Shared schema types are used across frontend and backend

### Environment Configuration
- **Development**: Uses `tsx` for hot reloading of TypeScript server
- **Production**: Runs compiled JavaScript with Node.js
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types and schemas
├── uploads/         # File upload storage
├── migrations/      # Database migration files
└── dist/           # Production build output
```

The application follows a monorepo structure with clear separation between client, server, and shared code, making it maintainable and scalable for future enhancements.