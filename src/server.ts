/**
 * Express Server
 * Main entry point. Runs on http://127.0.0.1:8080
 */

import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes';
import { db } from './db';

const app = express();
const port = 8080;

app.use(bodyParser.json());

/** Clears all data. Used for testing. */
app.post('/debug/clear', (req, res) => {
    db.students = [];
    db.canteens = [];
    db.reservations = [];
    res.sendStatus(204);
});

app.use('/', routes);

app.listen(port, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${port}`);
});