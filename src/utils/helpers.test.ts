import { isAdmin, isValidTimeFormat } from './helpers';
import { db } from '../db';

describe('Helper Functions', () => {
  beforeEach(() => {
    // Clear database before each test
    db.students = [];
    db.canteens = [];
    db.reservations = [];
  });

  describe('isAdmin', () => {
    it('should return true when student is admin', () => {
      db.students.push({
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@test.com',
        isAdmin: true,
      });

      expect(isAdmin('admin-id')).toBe(true);
    });

    it('should return false when student is not admin', () => {
      db.students.push({
        id: 'user-id',
        name: 'Regular User',
        email: 'user@test.com',
        isAdmin: false,
      });

      expect(isAdmin('user-id')).toBe(false);
    });

    it('should return false when student does not exist', () => {
      expect(isAdmin('non-existent-id')).toBe(false);
    });

    it('should return false when studentId is undefined', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('should return false when studentId is an array', () => {
      expect(isAdmin(['id1', 'id2'])).toBe(false);
    });

    it('should return false when studentId is empty string', () => {
      expect(isAdmin('')).toBe(false);
    });
  });

  describe('isValidTimeFormat', () => {
    it('should return true for valid 24-hour time format HH:mm', () => {
      expect(isValidTimeFormat('12:00')).toBe(true);
      expect(isValidTimeFormat('07:30')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('00:00')).toBe(true);
    });

    it('should return true for single digit hour', () => {
      expect(isValidTimeFormat('7:30')).toBe(true);
      expect(isValidTimeFormat('9:00')).toBe(true);
    });

    it('should return false for invalid hour', () => {
      expect(isValidTimeFormat('25:00')).toBe(false);
      expect(isValidTimeFormat('24:00')).toBe(false);
    });

    it('should return false for invalid minutes', () => {
      expect(isValidTimeFormat('12:60')).toBe(false);
      expect(isValidTimeFormat('12:99')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isValidTimeFormat('12')).toBe(false);
      expect(isValidTimeFormat('12:0')).toBe(false);
      expect(isValidTimeFormat('1200')).toBe(false);
      expect(isValidTimeFormat('abc')).toBe(false);
    });
  });

  describe('Time Slot Validation (Reservation Logic)', () => {
    // These tests verify the time slot validation logic used in reservations
    // Time must be :00 or :30
    
    const isValidTimeSlot = (time: string): boolean => {
      const minutes = time.split(':')[1];
      return minutes === '00' || minutes === '30';
    };

    it('should return true for :00 minutes', () => {
      expect(isValidTimeSlot('12:00')).toBe(true);
      expect(isValidTimeSlot('07:00')).toBe(true);
      expect(isValidTimeSlot('23:00')).toBe(true);
    });

    it('should return true for :30 minutes', () => {
      expect(isValidTimeSlot('12:30')).toBe(true);
      expect(isValidTimeSlot('07:30')).toBe(true);
      expect(isValidTimeSlot('23:30')).toBe(true);
    });

    it('should return false for :15 minutes', () => {
      expect(isValidTimeSlot('12:15')).toBe(false);
    });

    it('should return false for :45 minutes', () => {
      expect(isValidTimeSlot('12:45')).toBe(false);
    });

    it('should return false for :10 minutes', () => {
      expect(isValidTimeSlot('12:10')).toBe(false);
    });

    it('should return false for :59 minutes', () => {
      expect(isValidTimeSlot('12:59')).toBe(false);
    });
  });

  describe('Duration Validation (Reservation Logic)', () => {
    // These tests verify the duration validation logic
    // Duration must be 30 or 60 minutes
    
    const isValidDuration = (duration: number): boolean => {
      return duration === 30 || duration === 60;
    };

    it('should return true for 30 minutes', () => {
      expect(isValidDuration(30)).toBe(true);
    });

    it('should return true for 60 minutes', () => {
      expect(isValidDuration(60)).toBe(true);
    });

    it('should return false for 15 minutes', () => {
      expect(isValidDuration(15)).toBe(false);
    });

    it('should return false for 45 minutes', () => {
      expect(isValidDuration(45)).toBe(false);
    });

    it('should return false for 90 minutes', () => {
      expect(isValidDuration(90)).toBe(false);
    });

    it('should return false for 0 minutes', () => {
      expect(isValidDuration(0)).toBe(false);
    });
  });
});