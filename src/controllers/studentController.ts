/**
 * Student Controller
 * Handles student creation and retrieval.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Student } from '../models/types';

/** Creates a new student. Requires unique email. */
export const createStudent = (req: Request, res: Response) => {
    const { name, email, isAdmin } = req.body;

    if (!name || !email) {
        res.status(400).send("Missing required fields");
        return;
    }

    if (db.students.some(s => s.email === email)) {
        res.status(400).send("Email already exists");
        return;
    }

    const newStudent: Student = {
        id: uuidv4(),
        name,
        email,
        isAdmin: !!isAdmin
    };
    db.students.push(newStudent);
    res.status(201).json(newStudent);
};

/** Retrieves a student by ID. Returns 404 if not found. */
export const getStudent = (req: Request, res: Response) => {
    const student = db.students.find(s => s.id === req.params.id);
    if (!student) {
        res.status(404).send();
        return;
    }
    res.json(student);
};