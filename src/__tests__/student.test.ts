/**
 * STUDENT API UNIT TESTS
 * Tests all student-related requirements from the PDF specification
 */

import { Request, Response } from 'express';
import { createStudent, getStudent } from '../controllers/studentController';
import { db } from '../db';

// Mock Request/Response
const mockRequest = (body: any = {}, params: any = {}, headers: any = {}): Partial<Request> => ({
  body,
  params,
  headers,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Student API', () => {
  beforeEach(() => {
    // Clear database before each test
    db.students = [];
    db.canteens = [];
    db.reservations = [];
  });

  describe('POST /students - Create Student', () => {
    it('should create a student with all valid fields', () => {
      const req = mockRequest({ name: 'Marko Markovic', email: 'marko@test.com', isAdmin: false });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Marko Markovic',
          email: 'marko@test.com',
          isAdmin: false,
        })
      );
    });

    it('should create an admin student when isAdmin is true', () => {
      const req = mockRequest({ name: 'Admin User', email: 'admin@test.com', isAdmin: true });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: true,
        })
      );
    });

    it('should default isAdmin to false when not provided', () => {
      const req = mockRequest({ name: 'No Admin Field', email: 'noadmin@test.com' });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
        })
      );
    });

    it('should generate a unique ID for the student', () => {
      const req = mockRequest({ name: 'Test User', email: 'test@test.com' });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        })
      );
    });

    it('should return 400 when email is duplicate', () => {
      // First create a student
      db.students.push({
        id: 'existing-id',
        name: 'Existing User',
        email: 'duplicate@test.com',
        isAdmin: false,
      });

      const req = mockRequest({ name: 'New User', email: 'duplicate@test.com', isAdmin: false });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Email already exists');
    });

    it('should return 400 when name is missing', () => {
      const req = mockRequest({ email: 'noname@test.com' });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing required fields');
    });

    it('should return 400 when email is missing', () => {
      const req = mockRequest({ name: 'No Email' });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing required fields');
    });

    it('should return 400 when both name and email are missing', () => {
      const req = mockRequest({});
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should store the student in the database', () => {
      const req = mockRequest({ name: 'Stored User', email: 'stored@test.com', isAdmin: false });
      const res = mockResponse();

      createStudent(req as Request, res as Response);

      expect(db.students).toHaveLength(1);
      expect(db.students[0].email).toBe('stored@test.com');
    });
  });

  describe('GET /students/:id - Get Student by ID', () => {
    it('should return a student when found', () => {
      const studentId = 'test-student-id';
      db.students.push({
        id: studentId,
        name: 'Test User',
        email: 'test@test.com',
        isAdmin: false,
      });

      const req = mockRequest({}, { id: studentId });
      const res = mockResponse();

      getStudent(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: studentId,
          name: 'Test User',
          email: 'test@test.com',
        })
      );
    });

    it('should return 404 when student does not exist', () => {
      const req = mockRequest({}, { id: 'non-existent-id' });
      const res = mockResponse();

      getStudent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return the correct student among multiple students', () => {
      db.students.push(
        { id: 'student-1', name: 'User 1', email: 'user1@test.com', isAdmin: false },
        { id: 'student-2', name: 'User 2', email: 'user2@test.com', isAdmin: true },
        { id: 'student-3', name: 'User 3', email: 'user3@test.com', isAdmin: false }
      );

      const req = mockRequest({}, { id: 'student-2' });
      const res = mockResponse();

      getStudent(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'student-2',
          name: 'User 2',
          isAdmin: true,
        })
      );
    });
  });
});
