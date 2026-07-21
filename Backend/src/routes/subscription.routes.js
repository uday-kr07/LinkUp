import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
        } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/:channelId").post(
    verifyJWT,
    toggleSubscription
);

router.route("/following/:subscriberId").get(
    verifyJWT,
    getSubscribedChannels
);

router.route("/followers/:channelId").get(
    verifyJWT,
    getUserChannelSubscribers
);

export default router;