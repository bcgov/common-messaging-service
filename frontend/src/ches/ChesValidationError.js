export default class ChesValidationError extends Error {
  constructor(err) {
    // use detail as the 'message'
    super(err.detail);
    // store the errors structure from CHES
    this.errors = err.errors || [];
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ChesValidationError);
    } else {
      this.stack = (new Error(err.detail)).stack;
    }
  }
}
