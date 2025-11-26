/**
 * Helper Functions
 * Shared utility functions used across controllers.
 */

import { db } from '../db';

/** Checks if a student ID belongs to an admin. */
export const isAdmin = (studentId: string | string[] | undefined): boolean => {
    if (!studentId || Array.isArray(studentId)) return false;
    const student = db.students.find(s => s.id === studentId);
    return student ? student.isAdmin : false;
};

/** Validates HH:mm time format. */
export const isValidTimeFormat = (time: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);