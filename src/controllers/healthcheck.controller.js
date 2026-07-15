import { ApiResponse } from "../utils/api-responce.js";
import { asyncHandler } from "../utils/asyn-handler.js";

/**
const healthCheck = async (req, res, next) => {
  try {
    const user = await getUserFromDB()
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running" }));
  } catch (error) {
    next(err)
  }
};
 */

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200)
  .json(new ApiResponse(200, { message: "Server is running" }));
});

export { healthCheck };
