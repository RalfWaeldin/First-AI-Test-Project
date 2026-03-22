import { Router } from "express";

import {
  openRouterStreamingResponse,
  openRouterInterviewInput,
} from "#controllers";

const openRouter = Router();

openRouter.post("/messages", openRouterStreamingResponse);
openRouter.post("/interview", openRouterInterviewInput);

export default openRouter;
