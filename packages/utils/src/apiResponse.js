const isProd = process.env.NODE_ENV === 'production';

const apiResponse = (req, res, statusCode, message, data = null) => {
    const response = {
        success: true,
        statusCode,
        request: {
            method: req.method,
            url: req.originalUrl,
            query: req.query,
            params: req.params,
            body: req.body ? { ...req.body } : undefined,
        },
        message,
        data,
    };

    if (isProd) {
        delete response.request;
    }

    return res.status(statusCode).json(response);
};

export default apiResponse;
