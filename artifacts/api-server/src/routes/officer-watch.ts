import { Router } from "express";

/**
 * Intentionally empty and not registered. Individual officer identification,
 * tracking, transfer lists, and targeted alerts are outside the approved
 * Safety Hub model. Retaining this inert module avoids altering any legacy
 * records while ensuring no route can read, publish, or notify from them.
 */
const retiredOfficerWatchRouter = Router();

export default retiredOfficerWatchRouter;
