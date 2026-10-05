const isProd = process.env.NODE_ENV === 'production';

const apiResponse = (req, res, statusCode, message, data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 400,
    statusCode,
    ...(!isProd && {
      request: {
        method: req?.method,
        url: req?.raw?.url || req?.originalUrl || req?.url,
        query: req?.query,
        params: req?.params,
        body: req?.body ? { ...req.body } : undefined,
      },
    }),
    message,
    data,
  };

  if (typeof res?.json === 'function') {
    return res.status(statusCode).json(response);
  }
  return res.status(statusCode).send(response);
};

export default apiResponse;
