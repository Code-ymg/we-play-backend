import { asyncHandler } from "../utils/asyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";


const healthCheck = asyncHandler(async (_, res) => {
    return res
           .status(200)
           .json(
                new APIResponse(
                    200,
                    {
                        status: "ok",
                        message: "API is running smoothly",
                    },
                    "OK",
                )
            );
});

export { healthCheck };