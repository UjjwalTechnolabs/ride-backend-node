// errorResponse.js
class ErrorResponse {
  constructor(statusCode, message) {
    this.statusCode = statusCode;
    this.message = message;
  }

  send(res) {
    res.status(this.statusCode).json({
      status: "error",
      message: this.message,
    });
  }
}

module.exports = ErrorResponse;
