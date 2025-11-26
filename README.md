# 🍽️ Student Canteen Reservation System

A REST API for managing student canteen reservations, built for the [**"5 dana u oblacima 2025" challenge**](./5-dana-u-oblacima-2025-challenge-faza.pdf) by Levi9.

## 📋 Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Build and Run](#build-and-run)
- [Running Tests](#running-tests)
- [Postman Testing Guide](#postman-testing-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

---

## Overview

This system allows students to make reservations at university canteens. The application is built using **Node.js** with **TypeScript** and **Express.js** framework, using an **in-memory database** for data storage.

### Key Features

- **Student Management** - Create students with unique emails, designate admins
- **Canteen Management** - Admin-only CRUD operations for canteens with working hours (breakfast, lunch, dinner)
- **Reservation System** - Book time slots (30 or 60 minutes) within canteen working hours
- **Capacity Management** - Prevents overbooking based on canteen capacity
- **Status/Availability Queries** - Check available slots and remaining capacity across date ranges

---

## Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18.x | Runtime environment |
| **TypeScript** | 5.9.3 | Type-safe JavaScript superset |
| **Express.js** | 5.1.0 | Web application framework |
| **ts-node** | 10.9.2 | TypeScript execution engine |
| **Jest** | 30.2.0 | Unit testing framework |
| **ts-jest** | 29.4.5 | TypeScript preprocessor for Jest |
| **uuid** | 13.0.0 | UUID generation for entity IDs |
| **date-fns** | 4.1.0 | Date/time manipulation library |
| **body-parser** | 2.2.1 | Request body parsing middleware |

### Development Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/express** | 5.0.5 | TypeScript definitions for Express |
| **@types/node** | 24.10.1 | TypeScript definitions for Node.js |
| **@types/jest** | 30.0.0 | TypeScript definitions for Jest |
| **@types/uuid** | 10.0.0 | TypeScript definitions for uuid |

---

## Prerequisites

Before running the application, ensure you have installed:

- **Node.js** version 18.x or higher
- **npm** (comes bundled with Node.js)

Verify your installation:
```bash
node --version
npm --version
```

---

## Installation

1. **Extract/Clone the project**

2. **Navigate to the project directory**
   ```bash
   cd levi9_challenge
   ```

3. **Install all dependencies**
   ```bash
   npm install
   ```

---

## Build and Run

### Starting the Server

To build and run the application:

```bash
npm run start
```

This command uses `ts-node` to compile and run TypeScript directly.

The server will start and listen on:
```
http://127.0.0.1:8080
```

### Available npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm run start` | Compile and start the server |
| `test` | `npm test` | Run all unit tests |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |

---

## Running Tests

### Unit Tests

The project includes **112 unit tests** covering all API endpoints and application logic.

Run all unit tests:
```bash
npm test
```

Run tests with detailed output:
```bash
npm test -- --verbose
```

Run tests in watch mode (auto-reruns on changes):
```bash
npm run test:watch
```

#### Test Coverage by Module

| Test Suite | Tests | Description |
|------------|-------|-------------|
| `helpers.test.ts` | 23 | Helper functions (isAdmin, time validation) |
| `student.test.ts` | 12 | Student CRUD operations |
| `canteen.test.ts` | 33 | Canteen CRUD + status endpoints |
| `reservation.test.ts` | 44 | Reservation creation, validation, cancellation |
| **Total** | **112** | |

#### What's Tested

**Student API:**
- Create student with valid/invalid data
- Unique email validation
- Get student by ID
- 404 for non-existent students

**Canteen API:**
- Admin authorization (403 for non-admins)
- CRUD operations
- Cascade delete (cancels reservations)
- Status endpoint with slot calculation
- Duration-based slot intervals (30/60 min)

**Reservation API:**
- Duration validation (30 or 60 minutes only)
- Time slot validation (:00 or :30 only)
- Working hours validation
- Student overlap prevention
- Capacity limit enforcement
- Cancellation and rebooking

---

## Postman Testing Guide

The project includes a Postman collection and environment for integration testing. Follow these steps to import and configure them.

### Step 1: Import the Collection and Environment

1. Open **Postman** application
2. Click the **Import** button in the top-left corner
3. Select both files from the project root:
   - `5DanaUOblacima2025ChallengePublic.postman_collection.json`
   - `Levi9Cloud.postman_environment.json`
4. The collection will appear in your Collections sidebar
5. The environment will appear in your Environments

### Step 2: Configure the Environment

1. Click the **Environments** tab in the left sidebar
2. Select **Levi9Cloud**
3. Set the `baseURL` variable:
   - **Initial Value**: `http://127.0.0.1:8080`
   - **Current Value**: `http://127.0.0.1:8080`
4. Click **Save**
5. Select **Levi9Cloud** from the environment dropdown in the top-right corner of Postman

### Step 3: Start the Server

Before running any Postman requests, start the API server:

```bash
npm run start
```

The server will start at `http://127.0.0.1:8080`.

### Step 4: Clear Database Before Testing

Always reset the database before running the full collection:

1. Find the `POST /debug/clear` request in the collection
2. Click **Send**
3. You should receive a `204 No Content` response

Alternatively, use the terminal:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/debug/clear" -Method POST
```

### Step 5: Run the Collection

To run all requests in sequence:

1. Click the **"..."** menu next to the collection name
2. Select **Run collection**
3. Configure the run settings (optional):
   - **Iterations**: 1
   - **Delay**: 0 ms
4. Click **Run StudentCanteenReservation**
5. View the results in the Collection Runner

### Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://127.0.0.1:8080` | API server base URL |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not send request" | Make sure the server is running (`npm run start`) |
| "Connection refused" | Verify the server is on port 8080 and `baseUrl` is correct |
| Tests failing unexpectedly | Clear the database first with `POST /debug/clear` |
| "Variable not found" | Ensure you selected the correct environment in Postman |

---

## API Documentation

### Base URL
```
http://127.0.0.1:8080
```

### Debug Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/debug/clear` | Clear all data (reset database) |

#### Clear/Reset Database

To reset the in-memory database and clear all students, canteens, and reservations:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/debug/clear" -Method POST
```

**Response:** `204 No Content`

> **Note:** Always clear the database before running a fresh set of tests (e.g., Postman collection).

---

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/students` | Create a new student |
| GET | `/students/:id` | Get student by ID |

#### Create Student
```
POST /students
Content-Type: application/json
```
```json
{
  "name": "Marko Markovic",
  "email": "marko@example.com",
  "isAdmin": false
}
```

**Response (201):**
```json
{
  "id": "uuid-string",
  "name": "Marko Markovic",
  "email": "marko@example.com",
  "isAdmin": false
}
```

**Validation:**
- `name` - Required
- `email` - Required, must be unique
- `isAdmin` - Optional, defaults to `false`

---

### Canteen Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/canteens` | Create canteen | Admin |
| GET | `/canteens` | Get all canteens | - |
| GET | `/canteens/:id` | Get canteen by ID | - |
| PUT | `/canteens/:id` | Update canteen | Admin |
| DELETE | `/canteens/:id` | Delete canteen | Admin |
| GET | `/canteens/status` | Get global availability | - |
| GET | `/canteens/:id/status` | Get canteen availability | - |

#### Create Canteen (Admin Only)
```
POST /canteens
Content-Type: application/json
studentId: <admin-uuid>
```
```json
{
  "name": "Velika Menza",
  "location": "Novi Sad",
  "capacity": 50,
  "workingHours": [
    { "meal": "breakfast", "from": "07:00", "to": "10:00" },
    { "meal": "lunch", "from": "11:00", "to": "15:00" },
    { "meal": "dinner", "from": "17:00", "to": "20:00" }
  ]
}
```

#### Get Canteen Status
```
GET /canteens/:id/status?startDate=2025-12-01&endDate=2025-12-01&startTime=11:00&endTime=15:00&duration=30
```

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `startTime` - Start time (HH:mm)
- `endTime` - End time (HH:mm)
- `duration` - Slot duration: `30` or `60` minutes

**Response:**
```json
{
  "canteenId": "uuid-string",
  "slots": [
    {
      "date": "2025-12-01",
      "meal": "lunch",
      "startTime": "11:00",
      "remainingCapacity": 48
    }
  ]
}
```

---

### Reservation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reservations` | Create reservation |
| DELETE | `/reservations/:id` | Cancel reservation |

#### Create Reservation
```
POST /reservations
Content-Type: application/json
```
```json
{
  "studentId": "student-uuid",
  "canteenId": "canteen-uuid",
  "date": "2025-12-01",
  "time": "12:00",
  "duration": 30
}
```

**Validation Rules:**
- `duration` - Must be `30` or `60` minutes
- `time` - Must start on `:00` or `:30` (e.g., 12:00, 12:30)
- Time must be within canteen working hours
- Reservation must fit entirely within a meal period
- Student cannot have overlapping reservations
- Canteen capacity cannot be exceeded

#### Cancel Reservation
```
DELETE /reservations/:id
```

**Response (200):**
```json
{
  "id": "uuid-string",
  "studentId": "student-uuid",
  "canteenId": "canteen-uuid",
  "date": "2025-12-01",
  "time": "12:00",
  "duration": 30,
  "status": "Cancelled"
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Validation error |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Resource doesn't exist |

---

## Project Structure

```
levi9_challenge/
├── src/
│   ├── server.ts              # Express server setup
│   ├── db.ts                  # In-memory database
│   ├── controllers/
│   │   ├── studentController.ts
│   │   ├── canteenController.ts
│   │   └── reservationController.ts
│   ├── models/
│   │   └── types.ts           # TypeScript interfaces
│   ├── routes/
│   │   └── index.ts           # Route definitions
│   ├── utils/
│   │   ├── helpers.ts         # Helper functions
│   │   └── helpers.test.ts    # Helper unit tests
│   └── __tests__/
│       ├── setup.ts           # Jest setup
│       ├── student.test.ts    # Student API tests
│       ├── canteen.test.ts    # Canteen API tests
│       └── reservation.test.ts # Reservation API tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Application Rules

### Students
- Each student has a unique email address
- `isAdmin` flag determines canteen management permissions
- Students can have at most one active reservation per time slot

### Canteens
- Only administrators can create, update, or delete canteens
- Each canteen has defined working hours for meals (breakfast, lunch, dinner)
- Deleting a canteen automatically cancels all its active reservations (cascade)

### Reservations
- **Duration:** Must be exactly 30 or 60 minutes
- **Time slots:** Must start on the hour (:00) or half-hour (:30)
- **Working hours:** Must fall entirely within a canteen's meal period
- **No overlaps:** A student cannot have overlapping reservations
- **Capacity:** Cannot exceed the canteen's maximum capacity
- **Cancellation:** Sets status to "Cancelled" and frees up capacity

### Status/Availability
- Returns time slots based on requested duration (30 or 60 minutes apart)
- Shows remaining capacity for each slot
- Supports querying across date ranges and time windows
- Only counts active (non-cancelled) reservations

---

## License

MIT
