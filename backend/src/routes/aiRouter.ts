import { Router } from "express";

import {
  aiSimpleResonse,
  aiStreamingResponse,
  aiImageResponse,
} from "#controllers";

const olamaRouter = Router();

olamaRouter.post("/messages", aiSimpleResonse);
olamaRouter.post("/messages/streaming", aiStreamingResponse);
olamaRouter.post("/images", aiImageResponse);

export default olamaRouter;
