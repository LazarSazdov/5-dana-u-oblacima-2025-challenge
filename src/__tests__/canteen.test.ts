/**
 * CANTEEN API UNIT TESTS
 * Tests all canteen-related requirements from the PDF specification
 */

import { Request, Response } from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  updateCanteen,
  deleteCanteen,
  getCanteenStatus,
  getGlobalStatus,
} from '../controllers/canteenController';
import { db } from '../db';

// Mock Request/Response
const mockRequest = (body: any = {}, params: any = {}, headers: any = {}, query: any = {}): Partial<Request> => ({
  body,
  params,
  headers,
  query,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Canteen API', () => {
  const adminId = 'admin-id';
  const nonAdminId = 'non-admin-id';

  beforeEach(() => {
    // Clear database before each test
    db.students = [];
    db.canteens = [];
    db.reservations = [];

    // Setup admin and non-admin users
    db.students.push(
      { id: adminId, name: 'Admin User', email: 'admin@test.com', isAdmin: true },
      { id: nonAdminId, name: 'Regular User', email: 'user@test.com', isAdmin: false }
    );
  });

  describe('POST /canteens - Create Canteen', () => {
    const validCanteenData = {
      name: 'Velika Menza',
      location: 'Novi Sad',
      capacity: 20,
      workingHours: [
        { meal: 'breakfast', from: '07:00', to: '10:00' },
        { meal: 'lunch', from: '11:00', to: '15:00' },
        { meal: 'dinner', from: '17:00', to: '20:00' },
      ],
    };

    it('should create a canteen when admin is authorized', () => {
      const req = mockRequest(validCanteenData, {}, { studentid: adminId });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Velika Menza',
          location: 'Novi Sad',
          capacity: 20,
          workingHours: expect.arrayContaining([
            expect.objectContaining({ meal: 'breakfast' }),
            expect.objectContaining({ meal: 'lunch' }),
            expect.objectContaining({ meal: 'dinner' }),
          ]),
        })
      );
    });

    it('should generate a unique ID for the canteen', () => {
      const req = mockRequest(validCanteenData, {}, { studentid: adminId });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        })
      );
    });

    it('should return 403 when non-admin tries to create canteen', () => {
      const req = mockRequest(validCanteenData, {}, { studentid: nonAdminId });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
    });

    it('should return 403 when no studentId header is provided', () => {
      const req = mockRequest(validCanteenData, {}, {});
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when studentId does not exist in database', () => {
      const req = mockRequest(validCanteenData, {}, { studentid: 'non-existent-id' });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 when name is missing', () => {
      const { name, ...dataWithoutName } = validCanteenData;
      const req = mockRequest(dataWithoutName, {}, { studentid: adminId });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should store the canteen in the database', () => {
      const req = mockRequest(validCanteenData, {}, { studentid: adminId });
      const res = mockResponse();

      createCanteen(req as Request, res as Response);

      expect(db.canteens).toHaveLength(1);
      expect(db.canteens[0].name).toBe('Velika Menza');
    });
  });

  describe('GET /canteens - Get All Canteens', () => {
    it('should return empty array when no canteens exist', () => {
      const req = mockRequest();
      const res = mockResponse();

      getCanteens(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return all canteens', () => {
      db.canteens.push(
        { id: 'canteen-1', name: 'Canteen 1', location: 'Loc 1', capacity: 10, workingHours: [] },
        { id: 'canteen-2', name: 'Canteen 2', location: 'Loc 2', capacity: 20, workingHours: [] }
      );

      const req = mockRequest();
      const res = mockResponse();

      getCanteens(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'canteen-1' }),
        expect.objectContaining({ id: 'canteen-2' }),
      ]));
    });
  });

  describe('GET /canteens/:id - Get Canteen by ID', () => {
    it('should return a canteen when found', () => {
      db.canteens.push({
        id: 'canteen-id',
        name: 'Test Canteen',
        location: 'Test Location',
        capacity: 50,
        workingHours: [{ meal: 'lunch', from: '11:00', to: '14:00' }],
      });

      const req = mockRequest({}, { id: 'canteen-id' });
      const res = mockResponse();

      getCanteenById(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'canteen-id',
          name: 'Test Canteen',
        })
      );
    });

    it('should return 404 when canteen does not exist', () => {
      const req = mockRequest({}, { id: 'non-existent-id' });
      const res = mockResponse();

      getCanteenById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('PUT /canteens/:id - Update Canteen', () => {
    beforeEach(() => {
      db.canteens.push({
        id: 'canteen-to-update',
        name: 'Original Name',
        location: 'Original Location',
        capacity: 20,
        workingHours: [],
      });
    });

    it('should update canteen when admin is authorized', () => {
      const req = mockRequest({ capacity: 50 }, { id: 'canteen-to-update' }, { studentid: adminId });
      const res = mockResponse();

      updateCanteen(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          capacity: 50,
        })
      );
    });

    it('should return 403 when non-admin tries to update canteen', () => {
      const req = mockRequest({ capacity: 50 }, { id: 'canteen-to-update' }, { studentid: nonAdminId });
      const res = mockResponse();

      updateCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 when canteen does not exist', () => {
      const req = mockRequest({ capacity: 50 }, { id: 'non-existent-id' }, { studentid: adminId });
      const res = mockResponse();

      updateCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update multiple fields at once', () => {
      const req = mockRequest(
        { name: 'New Name', location: 'New Location', capacity: 100 },
        { id: 'canteen-to-update' },
        { studentid: adminId }
      );
      const res = mockResponse();

      updateCanteen(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          location: 'New Location',
          capacity: 100,
        })
      );
    });
  });

  describe('DELETE /canteens/:id - Delete Canteen', () => {
    beforeEach(() => {
      db.canteens.push({
        id: 'canteen-to-delete',
        name: 'Canteen to Delete',
        location: 'Location',
        capacity: 10,
        workingHours: [],
      });
    });

    it('should delete canteen when admin is authorized', () => {
      const req = mockRequest({}, { id: 'canteen-to-delete' }, { studentid: adminId });
      const res = mockResponse();

      deleteCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(db.canteens).toHaveLength(0);
    });

    it('should return 403 when non-admin tries to delete canteen', () => {
      const req = mockRequest({}, { id: 'canteen-to-delete' }, { studentid: nonAdminId });
      const res = mockResponse();

      deleteCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(db.canteens).toHaveLength(1); // Canteen should not be deleted
    });

    it('should return 404 when canteen does not exist', () => {
      const req = mockRequest({}, { id: 'non-existent-id' }, { studentid: adminId });
      const res = mockResponse();

      deleteCanteen(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should cascade cancel all reservations when canteen is deleted', () => {
      db.reservations.push(
        { id: 'res-1', studentId: 'student-1', canteenId: 'canteen-to-delete', date: '2025-12-01', time: '12:00', duration: 30, status: 'Active' },
        { id: 'res-2', studentId: 'student-2', canteenId: 'canteen-to-delete', date: '2025-12-01', time: '12:30', duration: 30, status: 'Active' },
        { id: 'res-3', studentId: 'student-3', canteenId: 'other-canteen', date: '2025-12-01', time: '12:00', duration: 30, status: 'Active' }
      );

      const req = mockRequest({}, { id: 'canteen-to-delete' }, { studentid: adminId });
      const res = mockResponse();

      deleteCanteen(req as Request, res as Response);

      expect(db.reservations.find(r => r.id === 'res-1')?.status).toBe('Cancelled');
      expect(db.reservations.find(r => r.id === 'res-2')?.status).toBe('Cancelled');
      expect(db.reservations.find(r => r.id === 'res-3')?.status).toBe('Active'); // Other canteen unaffected
    });

    it('should not affect already cancelled reservations', () => {
      db.reservations.push({
        id: 'already-cancelled',
        studentId: 'student-1',
        canteenId: 'canteen-to-delete',
        date: '2025-12-01',
        time: '12:00',
        duration: 30,
        status: 'Cancelled',
      });

      const req = mockRequest({}, { id: 'canteen-to-delete' }, { studentid: adminId });
      const res = mockResponse();

      deleteCanteen(req as Request, res as Response);

      expect(db.reservations.find(r => r.id === 'already-cancelled')?.status).toBe('Cancelled');
    });
  });

  describe('GET /canteens/:id/status - Get Canteen Status', () => {
    beforeEach(() => {
      db.canteens.push({
        id: 'status-canteen',
        name: 'Status Canteen',
        location: 'Location',
        capacity: 20,
        workingHours: [
          { meal: 'breakfast', from: '07:00', to: '10:00' },
          { meal: 'lunch', from: '11:00', to: '15:00' },
        ],
      });
    });

    it('should return status with slots for valid query', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '15:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          canteenId: 'status-canteen',
          slots: expect.any(Array),
        })
      );
    });

    it('should return slots with correct structure', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '12:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.slots[0]).toEqual(
        expect.objectContaining({
          date: expect.any(String),
          meal: expect.any(String),
          startTime: expect.any(String),
          remainingCapacity: expect.any(Number),
        })
      );
    });

    it('should return 404 when canteen does not exist', () => {
      const req = mockRequest(
        {},
        { id: 'non-existent-id' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '15:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when query params are missing', () => {
      const req = mockRequest({}, { id: 'status-canteen' }, {}, { startDate: '2025-12-01' });
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when duration is not 30 or 60', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '15:00', duration: '45' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should generate slots 30 minutes apart when duration is 30', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '12:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.slots[0].startTime).toBe('11:00');
      expect(response.slots[1].startTime).toBe('11:30');
    });

    it('should generate slots 60 minutes apart when duration is 60', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '14:00', duration: '60' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.slots[0].startTime).toBe('11:00');
      expect(response.slots[1].startTime).toBe('12:00');
      expect(response.slots[2].startTime).toBe('13:00');
    });

    it('should calculate remaining capacity correctly', () => {
      // Add a reservation
      db.reservations.push({
        id: 'res-1',
        studentId: 'student-1',
        canteenId: 'status-canteen',
        date: '2025-12-01',
        time: '11:00',
        duration: 30,
        status: 'Active',
      });

      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '12:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const slot11 = response.slots.find((s: any) => s.startTime === '11:00');
      expect(slot11.remainingCapacity).toBe(19); // 20 capacity - 1 reservation
    });

    it('should not count cancelled reservations', () => {
      db.reservations.push({
        id: 'cancelled-res',
        studentId: 'student-1',
        canteenId: 'status-canteen',
        date: '2025-12-01',
        time: '11:00',
        duration: 30,
        status: 'Cancelled',
      });

      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '12:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const slot11 = response.slots.find((s: any) => s.startTime === '11:00');
      expect(slot11.remainingCapacity).toBe(20); // Full capacity
    });

    it('should return slots for multiple days', () => {
      const req = mockRequest(
        {},
        { id: 'status-canteen' },
        {},
        { startDate: '2025-12-01', endDate: '2025-12-03', startTime: '11:00', endTime: '12:00', duration: '30' }
      );
      const res = mockResponse();

      getCanteenStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const dates = [...new Set(response.slots.map((s: any) => s.date))];
      expect(dates).toContain('2025-12-01');
      expect(dates).toContain('2025-12-02');
      expect(dates).toContain('2025-12-03');
    });
  });

  describe('GET /canteens/status - Get Global Status', () => {
    beforeEach(() => {
      db.canteens.push(
        {
          id: 'canteen-1',
          name: 'Canteen 1',
          location: 'Location 1',
          capacity: 10,
          workingHours: [{ meal: 'lunch', from: '11:00', to: '14:00' }],
        },
        {
          id: 'canteen-2',
          name: 'Canteen 2',
          location: 'Location 2',
          capacity: 20,
          workingHours: [{ meal: 'lunch', from: '11:00', to: '14:00' }],
        }
      );
    });

    it('should return status for all canteens', () => {
      const req = mockRequest(
        {},
        {},
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '14:00', duration: '30' }
      );
      const res = mockResponse();

      getGlobalStatus(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveLength(2);
      expect(response[0]).toHaveProperty('canteenId');
      expect(response[0]).toHaveProperty('slots');
    });

    it('should return 400 when query params are missing', () => {
      const req = mockRequest({}, {}, {}, {});
      const res = mockResponse();

      getGlobalStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when duration is invalid', () => {
      const req = mockRequest(
        {},
        {},
        {},
        { startDate: '2025-12-01', endDate: '2025-12-01', startTime: '11:00', endTime: '14:00', duration: '45' }
      );
      const res = mockResponse();

      getGlobalStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
