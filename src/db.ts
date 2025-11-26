/**
 * In-Memory Database
 * Stores all data in arrays. Data is lost when server restarts.
 */

import { Student, Canteen, Reservation } from './models/types';

export const db = {
    students: [] as Student[],
    canteens: [] as Canteen[],
    reservations: [] as Reservation[]
};