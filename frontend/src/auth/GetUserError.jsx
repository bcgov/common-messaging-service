export default class GetUserError extends Error {
  constructor(err) {
    super(err);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, GetUserError);
    } else {
      this.stack = (new Error(err.detail)).stack;
    }
  }
}
