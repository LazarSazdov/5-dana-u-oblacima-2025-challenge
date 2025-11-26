/**
 * API Routes
 * Maps endpoints to controller functions.
 */

import { Router } from 'express';
import * as studentController from '../controllers/studentController';
import * as canteenController from '../controllers/canteenController';
import * as reservationController from '../controllers/reservationController';

const router = Router();

// Student Routes
router.post('/students', studentController.createStudent);
router.get('/students/:id', studentController.getStudent);

// Canteen Routes
router.post('/canteens', canteenController.createCanteen);
router.get('/canteens', canteenController.getCanteens);
router.get('/canteens/status', canteenController.getGlobalStatus);
router.get('/canteens/:id', canteenController.getCanteenById);
router.get('/canteens/:id/status', canteenController.getCanteenStatus);
router.put('/canteens/:id', canteenController.updateCanteen);
router.delete('/canteens/:id', canteenController.deleteCanteen);

// Reservation Routes
router.post('/reservations', reservationController.createReservation);
router.delete('/reservations/:id', reservationController.cancelReservation);

export default router;