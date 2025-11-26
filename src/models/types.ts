/**
 * Type Definitions
 * TypeScript interfaces for all data models.
 */

export interface WorkingHour {
    meal: 'breakfast' | 'lunch' | 'dinner';
    from: string;
    to: string;
}

export interface Canteen {
    id: string;
    name: string;
    location: string;
    capacity: number;
    workingHours: WorkingHour[];
}

export interface Student {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
}

export interface Reservation {
    id: string;
    studentId: string;
    canteenId: string;
    date: string;
    time: string;
    duration: number;
    status: 'Active' | 'Cancelled';
}