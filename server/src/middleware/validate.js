import { ApiError } from '../utils/ApiError.js';

/** validate({ body, query, params }) -> parsed values on req.valid.{body,query,params}. */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(new ApiError(400, errors[0]?.message || 'Validation failed', errors));
    }
    req.valid[part] = result.data;
  }
  next();
};
