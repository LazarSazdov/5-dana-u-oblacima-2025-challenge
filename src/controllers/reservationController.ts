/**
 * Reservation Controller
 * Handles reservation creation and cancellation with validation.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { parse, addMinutes, isBefore } from 'date-fns';
import { db } from '../db';
import { Reservation } from '../models/types';

/** Checks if two time ranges overlap. */
const isOverlapping = (startA: Date, endA: Date, startB: Date, endB: Date) => {
    return startA < endB && endA > startB;
};

/** Creates a reservation. Validates duration, time slot, working hours, conflicts, and capacity. */
export const createReservation = (req: Request, res: Response) => {
    const { studentId, canteenId, date, time, duration } = req.body;

    if (!studentId || !canteenId || !date || !time || !duration) {
        res.status(400).send("Missing required fields");
        return;
    }

    const student = db.students.find(s => s.id === studentId);
    if (!student) {
        res.status(400).send("Student not found");
        return;
    }

    // Duration must be 30 or 60 minutes
    if (duration !== 30 && duration !== 60) {
        res.status(400).send("Duration must be 30 or 60 minutes");
        return;
    }

    // Time must start on :00 or :30
    const minutesPart = time.split(':')[1];
    if (minutesPart !== '00' && minutesPart !== '30') {
        res.status(400).send("Time must start on the hour or half hour");
        return;
    }

    // Cannot book in the past
    const reservationStart = parse(`${date}T${time}`, "yyyy-MM-dd'T'HH:mm", new Date());
    if (isBefore(reservationStart, new Date())) {
        res.status(400).send("Cannot create reservations in the past");
        return;
    }

    const canteen = db.canteens.find(c => c.id === canteenId);
    if (!canteen) {
        res.status(400).send("Canteen not found");
        return;
    }

    // Reservation must fit within working hours
    const reservationEnd = addMinutes(reservationStart, duration);
    const fitsInSchedule = canteen.workingHours.some(wh => {
        const whFromMin = parseInt(wh.from.split(':')[0]) * 60 + parseInt(wh.from.split(':')[1]);
        const whToMin = parseInt(wh.to.split(':')[0]) * 60 + parseInt(wh.to.split(':')[1]);
        const resStartMin = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
        const resEndMin = resStartMin + duration;
        return (resStartMin >= whFromMin && resEndMin <= whToMin);
    });

    if (!fitsInSchedule) {
        res.status(400).send("Reservation is outside of working hours");
        return;
    }

    // Student cannot have overlapping reservations
    const studentHasOverlap = db.reservations.some(r => {
        if (r.studentId !== studentId || r.status === 'Cancelled') return false;
        const existingStart = parse(`${r.date}T${r.time}`, "yyyy-MM-dd'T'HH:mm", new Date());
        const existingEnd = addMinutes(existingStart, r.duration);
        return isOverlapping(reservationStart, reservationEnd, existingStart, existingEnd);
    });

    if (studentHasOverlap) {
        res.status(400).send("Student already has a reservation at this time");
        return;
    }

    // Check canteen capacity
    const concurrentReservations = db.reservations.filter(r => {
        if (r.canteenId !== canteenId || r.status === 'Cancelled') return false;
        const rStart = parse(`${r.date}T${r.time}`, "yyyy-MM-dd'T'HH:mm", new Date());
        const rEnd = addMinutes(rStart, r.duration);
        return isOverlapping(reservationStart, reservationEnd, rStart, rEnd);
    });

    if (concurrentReservations.length >= canteen.capacity) {
        res.status(400).send("Canteen capacity reached for this slot");
        return;
    }

    const newReservation: Reservation = {
        id: uuidv4(),
        status: 'Active',
        studentId,
        canteenId,
        date,
        time,
        duration
    };

    db.reservations.push(newReservation);
    res.status(201).json(newReservation);
};

/** Cancels a reservation by setting status to 'Cancelled'. */
export const cancelReservation = (req: Request, res: Response) => {
    const reservation = db.reservations.find(r => r.id === req.params.id);

    if (!reservation) {
        res.status(404).send("Reservation not found");
        return;
    }

    reservation.status = 'Cancelled';
    res.status(200).json(reservation);
};