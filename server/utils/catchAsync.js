/**
 * Higher-order function to eliminate boilerplate try-catch blocks in async controllers.
 * Catches rejected promises and forwards them to the global error handler middleware via next().
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
