import { AppError } from '../utils/api.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Проверьте заполненные поля', result.error.flatten()));
  }
  if (source === 'query') req.validatedQuery = result.data;
  else req[source] = result.data;
  next();
};
