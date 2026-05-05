# SUIC App Backend

Backend API for SUIC application built with NestJS and TypeScript.

## Project Setup

```bash
$ npm install
```

## Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the environment variables with your configuration

## Database Setup

Make sure you have PostgreSQL running and create a database named `suicapp` (or update DB_NAME in .env).

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Database Migrations

```bash
# generate migration
$ npm run migration:generate -- src/migrations/MigrationName

# run migrations
$ npm run migration:run

# revert migration
$ npm run migration:revert
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Project Structure

```
src/
├── auth/              # Authentication module
├── users/             # Users module
├── common/            # Shared utilities and interfaces
├── database/          # Database configuration
├── email/             # Email service (if needed)
├── migrations/        # Database migrations
├── app.module.ts      # Root module
├── main.ts           # Application entry point
└── data-source.ts    # TypeORM data source
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Users

- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `PATCH /users/:id` - Update user (protected)
- `DELETE /users/:id` - Delete user (protected)

## Development Guidelines

- Follow the established naming conventions
- Use TypeScript strict mode
- Implement proper error handling
- Add validation to DTOs
- Write tests for new features
- Follow the commit message format
