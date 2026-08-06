import { AppError } from '../utils/api.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Проверьте заполненные поля', result.error.flatten()));
  }
  req[source] = result.data;
  next();
};
