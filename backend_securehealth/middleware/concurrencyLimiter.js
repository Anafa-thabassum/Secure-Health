import { AppError } from "../utils/errors.js";

export const createConcurrencyLimiter = (maximum) => {
  let active = 0;
  return (req, res, next) => {
    if (active >= maximum) return next(new AppError(503, "CAPACITY_EXCEEDED", "The service is temporarily at capacity"));
    active += 1;
    let released = false;
    const release = () => { if (!released) { released = true; active -= 1; } };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
};

