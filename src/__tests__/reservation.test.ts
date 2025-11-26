/**
 * RESERVATION API UNIT TESTS
 * Tests all reservation-related requirements from the PDF specification
 */

import { Request, Response } from 'express';
import { createReservation, cancelReservation } from '../controllers/reservationController';
import { db } from '../db';

// Mock Request/Response
const mockRequest = (body: any = {}, params: any = {}): Partial<Request> => ({
  body,
  params,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Reservation API', () => {
  const studentId = 'student-1';
  const student2Id = 'student-2';
  const student3Id = 'student-3';
  const canteenId = 'canteen-1';
  const canteen2Id = 'canteen-2';

  beforeEach(() => {
    // Clear database before each test
    db.students = [];
    db.canteens = [];
    db.reservations = [];

    // Setup test students
    db.students.push(
      { id: studentId, name: 'Student 1', email: 'student1@test.com', isAdmin: false },
      { id: student2Id, name: 'Student 2', email: 'student2@test.com', isAdmin: false },
      { id: student3Id, name: 'Student 3', email: 'student3@test.com', isAdmin: false }
    );

    // Setup test canteens
    db.canteens.push(
      {
        id: canteenId,
        name: 'Main Canteen',
        location: 'Location 1',
        capacity: 20,
        workingHours: [
          { meal: 'breakfast', from: '07:00', to: '10:00' },
          { meal: 'lunch', from: '11:00', to: '15:00' },
          { meal: 'dinner', from: '17:00', to: '20:00' },
        ],
      },
      {
        id: canteen2Id,
        name: 'Small Canteen',
        location: 'Location 2',
        capacity: 10,
        workingHours: [
          { meal: 'breakfast', from: '07:00', to: '09:00' },
          { meal: 'lunch', from: '11:00', to: '14:00' },
        ],
      }
    );
  });

  describe('POST /reservations - Create Reservation', () => {
    describe('Valid Reservations', () => {
      it('should create a reservation with 30 minute duration', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            status: 'Active',
            studentId,
            canteenId,
            date: '2025-12-01',
            time: '12:00',
            duration: 30,
          })
        );
      });

      it('should create a reservation with 60 minute duration', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-02',
          time: '12:00',
          duration: 60,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 60,
          })
        );
      });

      it('should create reservation at time ending with :00', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '11:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should create reservation at time ending with :30', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '11:30',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should generate a unique ID for the reservation', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
          })
        );
      });

      it('should set status to Active for new reservation', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'Active',
          })
        );
      });

      it('should store the reservation in the database', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(db.reservations).toHaveLength(1);
      });

      it('should allow different students to book the same time slot', () => {
        // First student books
        const req1 = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res1 = mockResponse();
        createReservation(req1 as Request, res1 as Response);

        // Second student books same slot
        const req2 = mockRequest({
          studentId: student2Id,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res2 = mockResponse();
        createReservation(req2 as Request, res2 as Response);

        expect(res2.status).toHaveBeenCalledWith(201);
        expect(db.reservations).toHaveLength(2);
      });

      it('should allow reservation at exact working hour start', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '07:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should allow reservation 30 min before working hour ends', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '09:30',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('Past Date Validation', () => {
      it('should return 400 when reservation date is in the past', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2020-01-01', // Past date
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Cannot create reservations in the past');
      });

      it('should return 400 when reservation date and time is in the past', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2024-01-15',
          time: '10:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Invalid Duration', () => {
      it('should return 400 when duration is 45 minutes', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 45,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Duration must be 30 or 60 minutes');
      });

      it('should return 400 when duration is 15 minutes', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 15,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when duration is 90 minutes', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 90,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Invalid Time Slot', () => {
      it('should return 400 when time is :15', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:15',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Time must start on the hour or half hour');
      });

      it('should return 400 when time is :45', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:45',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when time is :10', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:10',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Working Hours Validation', () => {
      it('should return 400 when time is before working hours', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '06:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Reservation is outside of working hours');
      });

      it('should return 400 when time is after working hours', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '21:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when 60 min reservation extends beyond working hours', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '19:30',
          duration: 60,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when reservation is between meal periods', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '10:30', // Between breakfast (10:00 end) and lunch (11:00 start)
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when 30 min reservation would end after working hours', () => {
        // Breakfast ends at 10:00, so starting at 10:00 means ending at 10:30 (outside)
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '10:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Entity Validation', () => {
      it('should return 400 when student does not exist', () => {
        const req = mockRequest({
          studentId: 'non-existent-student',
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Student not found');
      });

      it('should return 400 when canteen does not exist', () => {
        const req = mockRequest({
          studentId,
          canteenId: 'non-existent-canteen',
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Canteen not found');
      });
    });

    describe('Missing Fields', () => {
      it('should return 400 when studentId is missing', () => {
        const req = mockRequest({
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when canteenId is missing', () => {
        const req = mockRequest({
          studentId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when date is missing', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when time is missing', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when duration is missing', () => {
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Student Double Booking Prevention', () => {
      it('should return 400 when student books same time slot twice', () => {
        // First booking
        db.reservations.push({
          id: 'existing-res',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
          status: 'Active',
        });

        // Try to book same slot
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Student already has a reservation at this time');
      });

      it('should return 400 when student has overlapping reservation in different canteen', () => {
        // First booking in canteen 1
        db.reservations.push({
          id: 'existing-res',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
          status: 'Active',
        });

        // Try to book same slot in canteen 2
        const req = mockRequest({
          studentId,
          canteenId: canteen2Id,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 when new 60 min reservation overlaps with existing 30 min', () => {
        db.reservations.push({
          id: 'existing-res',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:30',
          duration: 30,
          status: 'Active',
        });

        // Try to book 12:00-13:00 which overlaps with 12:30-13:00
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 60,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should allow booking after cancelled reservation', () => {
        db.reservations.push({
          id: 'cancelled-res',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
          status: 'Cancelled',
        });

        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should allow booking non-overlapping slots', () => {
        db.reservations.push({
          id: 'existing-res',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
          status: 'Active',
        });

        // Book at 12:30 (after existing 12:00-12:30)
        const req = mockRequest({
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:30',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('Capacity Limit', () => {
      it('should return 400 when canteen capacity is reached', () => {
        // Fill up small canteen (capacity 10) at 11:00
        for (let i = 0; i < 10; i++) {
          const capStudentId = `cap-student-${i}`;
          db.students.push({
            id: capStudentId,
            name: `Cap Student ${i}`,
            email: `cap${i}@test.com`,
            isAdmin: false,
          });
          db.reservations.push({
            id: `cap-res-${i}`,
            studentId: capStudentId,
            canteenId: canteen2Id,
            date: '2025-12-05',
            time: '11:00',
            duration: 30,
            status: 'Active',
          });
        }

        // Try to add 11th reservation
        const req = mockRequest({
          studentId,
          canteenId: canteen2Id,
          date: '2025-12-05',
          time: '11:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Canteen capacity reached for this slot');
      });

      it('should not count cancelled reservations towards capacity', () => {
        // Fill up with 10 cancelled reservations
        for (let i = 0; i < 10; i++) {
          db.reservations.push({
            id: `cancelled-res-${i}`,
            studentId: `student-${i}`,
            canteenId: canteen2Id,
            date: '2025-12-05',
            time: '11:00',
            duration: 30,
            status: 'Cancelled',
          });
        }

        const req = mockRequest({
          studentId,
          canteenId: canteen2Id,
          date: '2025-12-05',
          time: '11:00',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should check capacity with overlapping reservations', () => {
        // Fill up small canteen (capacity 10) with 60-min reservations at 11:00
        for (let i = 0; i < 10; i++) {
          const capStudentId = `cap-student-${i}`;
          db.students.push({
            id: capStudentId,
            name: `Cap Student ${i}`,
            email: `cap${i}@test.com`,
            isAdmin: false,
          });
          db.reservations.push({
            id: `cap-res-${i}`,
            studentId: capStudentId,
            canteenId: canteen2Id,
            date: '2025-12-05',
            time: '11:00',
            duration: 60, // 11:00 - 12:00
            status: 'Active',
          });
        }

        // Try to book 11:30 (overlaps with existing 11:00-12:00 reservations)
        const req = mockRequest({
          studentId,
          canteenId: canteen2Id,
          date: '2025-12-05',
          time: '11:30',
          duration: 30,
        });
        const res = mockResponse();

        createReservation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });

  describe('DELETE /reservations/:id - Cancel Reservation', () => {
    beforeEach(() => {
      db.reservations.push({
        id: 'res-to-cancel',
        studentId,
        canteenId,
        date: '2025-12-01',
        time: '12:00',
        duration: 30,
        status: 'Active',
      });
    });

    it('should cancel a reservation and set status to Cancelled', () => {
      const req = mockRequest({}, { id: 'res-to-cancel' });
      const res = mockResponse();

      cancelReservation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'res-to-cancel',
          status: 'Cancelled',
        })
      );
    });

    it('should return the cancelled reservation object', () => {
      const req = mockRequest({}, { id: 'res-to-cancel' });
      const res = mockResponse();

      cancelReservation(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'res-to-cancel',
          studentId,
          canteenId,
          date: '2025-12-01',
          time: '12:00',
          duration: 30,
          status: 'Cancelled',
        })
      );
    });

    it('should update the reservation in the database', () => {
      const req = mockRequest({}, { id: 'res-to-cancel' });
      const res = mockResponse();

      cancelReservation(req as Request, res as Response);

      const dbReservation = db.reservations.find(r => r.id === 'res-to-cancel');
      expect(dbReservation?.status).toBe('Cancelled');
    });

    it('should return 404 when reservation does not exist', () => {
      const req = mockRequest({}, { id: 'non-existent-id' });
      const res = mockResponse();

      cancelReservation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Reservation not found');
    });

    it('should allow rebooking the same slot after cancellation', () => {
      // Cancel existing reservation
      const cancelReq = mockRequest({}, { id: 'res-to-cancel' });
      const cancelRes = mockResponse();
      cancelReservation(cancelReq as Request, cancelRes as Response);

      // Rebook the same slot
      const bookReq = mockRequest({
        studentId,
        canteenId,
        date: '2025-12-01',
        time: '12:00',
        duration: 30,
      });
      const bookRes = mockResponse();
      createReservation(bookReq as Request, bookRes as Response);

      expect(bookRes.status).toHaveBeenCalledWith(201);
    });

    it('should free up capacity after cancellation', () => {
      // Fill up canteen
      for (let i = 0; i < 9; i++) {
        const capStudentId = `cap-student-${i}`;
        db.students.push({
          id: capStudentId,
          name: `Cap Student ${i}`,
          email: `cap${i}@test.com`,
          isAdmin: false,
        });
        db.reservations.push({
          id: `cap-res-${i}`,
          studentId: capStudentId,
          canteenId: canteen2Id,
          date: '2025-12-10',
          time: '11:00',
          duration: 30,
          status: 'Active',
        });
      }

      // Add one more to reach capacity of 10
      db.reservations.push({
        id: 'last-res',
        studentId: 'last-student',
        canteenId: canteen2Id,
        date: '2025-12-10',
        time: '11:00',
        duration: 30,
        status: 'Active',
      });
      db.students.push({ id: 'last-student', name: 'Last', email: 'last@test.com', isAdmin: false });

      // Now at capacity - cancel one
      const cancelReq = mockRequest({}, { id: 'last-res' });
      const cancelRes = mockResponse();
      cancelReservation(cancelReq as Request, cancelRes as Response);

      // Should be able to book now
      const bookReq = mockRequest({
        studentId,
        canteenId: canteen2Id,
        date: '2025-12-10',
        time: '11:00',
        duration: 30,
      });
      const bookRes = mockResponse();
      createReservation(bookReq as Request, bookRes as Response);

      expect(bookRes.status).toHaveBeenCalledWith(201);
    });
  });
});
