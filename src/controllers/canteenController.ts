/**
 * Canteen Controller
 * Handles canteen CRUD operations (admin-only) and availability status queries.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { parse, format, addDays, addMinutes, isBefore, isEqual } from 'date-fns';
import { db } from '../db';
import { Canteen } from '../models/types';
import { isAdmin } from '../utils/helpers';

/** Calculates available time slots for a canteen within a date/time range. */
const calculateSlots = (canteen: Canteen, startDate: string, endDate: string, startTime: string, endTime: string, duration: number) => {
    const resultSlots: any[] = [];
    let currentDay = parse(startDate, 'yyyy-MM-dd', new Date());
    const finalDay = parse(endDate, 'yyyy-MM-dd', new Date());

    while (isBefore(currentDay, finalDay) || isEqual(currentDay, finalDay)) {
        const dateStr = format(currentDay, 'yyyy-MM-dd');
        let currentSlotTime = parse(`${dateStr}T${startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
        const endSlotTime = parse(`${dateStr}T${endTime}`, "yyyy-MM-dd'T'HH:mm", new Date());

        while (isBefore(currentSlotTime, endSlotTime)) {
            const slotStartStr = format(currentSlotTime, 'HH:mm');
            const slotEndTime = addMinutes(currentSlotTime, duration);
            
            // Check if slot fits within a working hour block
            const workingHour = canteen.workingHours.find(wh => {
                const whStart = parse(`${dateStr}T${wh.from}`, "yyyy-MM-dd'T'HH:mm", new Date());
                const whEnd = parse(`${dateStr}T${wh.to}`, "yyyy-MM-dd'T'HH:mm", new Date());
                return (currentSlotTime >= whStart && slotEndTime <= whEnd);
            });

            if (workingHour) {
                // Count overlapping reservations to calculate remaining capacity
                const activeReservations = db.reservations.filter(r => {
                    if (r.canteenId !== canteen.id || r.status === 'Cancelled') return false;
                    const rStart = parse(`${r.date}T${r.time}`, "yyyy-MM-dd'T'HH:mm", new Date());
                    const rEnd = addMinutes(rStart, r.duration);
                    return (currentSlotTime < rEnd && slotEndTime > rStart);
                }).length;

                resultSlots.push({
                    date: dateStr,
                    meal: workingHour.meal,
                    startTime: slotStartStr,
                    remainingCapacity: Math.max(0, canteen.capacity - activeReservations)
                });
            }

            currentSlotTime = addMinutes(currentSlotTime, duration);
        }

        currentDay = addDays(currentDay, 1);
    }
    return resultSlots;
};

/** Creates a new canteen. Admin only. */
export const createCanteen = (req: Request, res: Response) => {
    const studentId = req.headers['studentid'] as string;
    if (!isAdmin(studentId)) { res.status(403).send("Unauthorized"); return; }

    const { name, location, capacity, workingHours } = req.body;
    if (!name || !location || !capacity || !workingHours) { res.status(400).send("Missing fields"); return; }

    const newCanteen: Canteen = {
        id: uuidv4(),
        name,
        location,
        capacity,
        workingHours
    };
    db.canteens.push(newCanteen);
    res.status(201).json(newCanteen);
};

/** Returns all canteens. */
export const getCanteens = (req: Request, res: Response) => {
    res.json(db.canteens);
};

/** Returns a canteen by ID. Returns 404 if not found. */
export const getCanteenById = (req: Request, res: Response) => {
    const canteen = db.canteens.find(c => c.id === req.params.id);
    if (!canteen) { res.status(404).send(); return; }
    res.json(canteen);
};

/** Updates a canteen. Admin only. */
export const updateCanteen = (req: Request, res: Response) => {
    const studentId = req.headers['studentid'] as string;
    if (!isAdmin(studentId)) { res.status(403).send(); return; }

    const canteenIndex = db.canteens.findIndex(c => c.id === req.params.id);
    if (canteenIndex === -1) { res.status(404).send(); return; }

    const updatedCanteen = { ...db.canteens[canteenIndex], ...req.body };
    db.canteens[canteenIndex] = updatedCanteen;
    res.json(updatedCanteen);
};

/** Deletes a canteen and cancels its reservations. Admin only. */
export const deleteCanteen = (req: Request, res: Response) => {
    const studentId = req.headers['studentid'] as string;
    if (!isAdmin(studentId)) { res.status(403).send(); return; }

    const canteenId = req.params.id;
    const index = db.canteens.findIndex(c => c.id === canteenId);
    if (index === -1) { res.status(404).send(); return; }

    db.canteens.splice(index, 1);

    // Cascade: cancel all reservations for this canteen
    db.reservations.forEach(r => {
        if (r.canteenId === canteenId && r.status === 'Active') {
            r.status = 'Cancelled';
        }
    });

    res.status(204).send();
};

/** Returns availability slots for all canteens. */
export const getGlobalStatus = (req: Request, res: Response) => {
    const { startDate, endDate, startTime, endTime, duration } = req.query as any;
    
    if (!startDate || !endDate || !startTime || !endTime || !duration) {
        res.status(400).send("Missing query parameters");
        return;
    }

    const durationNum = parseInt(duration);
    if (durationNum !== 30 && durationNum !== 60) {
        res.status(400).send("Duration must be 30 or 60 minutes");
        return;
    }

    const response = db.canteens.map(c => ({
        canteenId: c.id,
        slots: calculateSlots(c, startDate, endDate, startTime, endTime, durationNum)
    }));

    res.json(response);
};

/** Returns availability slots for a specific canteen. */
export const getCanteenStatus = (req: Request, res: Response) => {
    const { startDate, endDate, startTime, endTime, duration } = req.query as any;
    const canteen = db.canteens.find(c => c.id === req.params.id);

    if (!canteen) { res.status(404).send(); return; }
    if (!startDate || !endDate || !startTime || !endTime || !duration) {
        res.status(400).send("Missing query parameters");
        return;
    }

    const durationNum = parseInt(duration);
    if (durationNum !== 30 && durationNum !== 60) {
        res.status(400).send("Duration must be 30 or 60 minutes");
        return;
    }

    const slots = calculateSlots(canteen, startDate, endDate, startTime, endTime, durationNum);
    
    res.json({
        canteenId: canteen.id,
        slots: slots
    });
};