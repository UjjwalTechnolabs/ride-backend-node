// successResponse.js
class SuccessResponse {
  constructor(statusCode, data) {
    this.statusCode = statusCode;
    this.data = data;
  }

  send(res) {
    res.status(this.statusCode).json({
      status: "success",
      data: this.data,
    });
  }
}

module.exports = SuccessResponse;
