import { ZodError } from 'zod';
import { hasZodFastifySchemaValidationErrors } from '@fastify/type-provider-zod';
import { AppError } from '@graphmint/errors';

export const errorHandler = (error, request, reply) => {
  const isAppError = error instanceof AppError;
  const isZodError = error instanceof ZodError;
  const isZodSchemaValidation = hasZodFastifySchemaValidationErrors(error);
  const isFastifyValidation = Array.isArray(error.validation);
  const isPrismaError =
    Boolean(error?.code) &&
    typeof error.code === 'string' &&
    error.code.startsWith('P');

  // Determine HTTP status code
  let statusCode = 500;
  if (isAppError) {
    statusCode = error.statusCode;
  } else if (isZodError || isZodSchemaValidation || isFastifyValidation) {
    statusCode = 400;
  } else if (isPrismaError) {
    statusCode = mapPrismaStatus(error.code);
  } else if (error.statusCode) {
    statusCode = error.statusCode;
  }

  // Fastify logger with request-bound context
  request.log.error(
    {
      reqId: request.id,
      name: error?.name,
      message: error?.message,
      statusCode,
      method: request.method,
      url: request.url,
      ip: request.ip,
      stack: error?.stack,
      ...(isAppError && error.code ? { errorCode: error.code } : {}),
    },
    'Error caught in request pipeline'
  );

  const isProd = process.env.NODE_ENV === 'production';
  const mainMessage =
    statusCode >= 500
      ? 'We are having a temporary issue. Please try again in a moment.'
      : error.message;

  const response = {
    success: false,
    statusCode,
    message: mainMessage,
    data: null,
    details: {},
  };

  if (!isProd) {
    response.request = {
      method: request.method,
      url: request.url,
      query: request.query,
      params: request.params,
      body: request.body,
    };
  }

  if (isAppError) {
    if (error.errors) {
      response.data = error.errors;
      response.details.errors = error.errors;
    } else if ('details' in error && error.details) {
      response.data = error.details;
      response.details.errors = error.details;
    }
  }

  if (isZodError) {
    response.message = 'Validation failed';
    const errors = error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    response.data = errors;
    response.details.errors = errors;
  } else if (isZodSchemaValidation || isFastifyValidation) {
    response.message = 'Validation failed';
    const errors = error.validation.map((e) => ({
      field:
        e.instancePath?.replace(/^\//, '') ||
        (Array.isArray(e.params?.missingProperty)
          ? e.params.missingProperty.join('.')
          : e.params?.missingProperty) ||
        e.keyword ||
        'field',
      message: e.message,
    }));
    response.data = errors;
    response.details.errors = errors;
  }

  if (error.name === 'ValidationError' && error.inner) {
    response.message = 'Validation failed';
    const errors = error.inner.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    response.data = errors;
    response.details.errors = errors;
  }

  if (isPrismaError) {
    response.message = mapPrismaMessage(error);
  }

  if (!isProd) {
    response.details = {
      ...response.details,
      errorName: error.name,
      originalMessage: error.message,
      stack: error.stack,
    };
  } else {
    if (Object.keys(response.details).length === 0) {
      response.details = undefined;
    }
  }

  return reply.status(statusCode).send(response);
};

export default errorHandler;

function mapPrismaStatus(code) {
  switch (code) {
    case 'P2002':
      return 409;
    case 'P2025':
      return 404;
    case 'P2003':
      return 400;
    default:
      return 400;
  }
}

function mapPrismaMessage(err) {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : err.meta?.target || 'field';
      return `A record with that ${target} already exists`;
    }
    case 'P2025':
      return 'Record not found';
    case 'P2003':
      return 'Related record not found';
    default:
      return 'Database error';
  }
}
