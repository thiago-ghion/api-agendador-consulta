exports = module.exports = createApplication;
function createApplication() {
  return {
    use: jest.fn(),
    listen: jest.fn(),
    get: jest.fn(),
  };
}

exports.json = jest.fn();
exports.query = jest.fn();
exports.static = jest.fn();
exports.urlencoded = jest.fn();
exports.resetMocked = jest.fn();
