export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Unexpected server error',
    details: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}
