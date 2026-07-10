import express from "express";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/upload", upload.single("media"), (req, res) => {
    console.log(req.file);

    res.status(200).json({
        success: true,
        message: "File received successfully",
        file: {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
        },
    });
});

export default router;