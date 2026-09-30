export const requestTimeout = (milliseconds) => (req, res, next) => {
  const controller = new AbortController();
  req.abortSignal = controller.signal;
  const timer = setTimeout(() => {
    controller.abort();
    if (!res.headersSent) res.status(503).json({ error: { code: "REQUEST_TIMEOUT", message: "The service did not complete the request in time", requestId: req.requestId } });
  }, milliseconds);
  const clear = () => clearTimeout(timer);
  res.once("finish", clear);
  res.once("close", clear);
  next();
};

