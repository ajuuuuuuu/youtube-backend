import { Router } from "express";
import {uploadVideoFiles,upload} from "../middlewares/multer.middleware.js"
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").get(getAllVideos).post(uploadVideoFiles, publishAVideo);
router.route("/:videoId").get(getVideoById).patch(upload.single("thumbnail"),updateVideo).delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;