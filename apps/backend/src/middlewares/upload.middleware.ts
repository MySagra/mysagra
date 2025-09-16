import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg'
    ) {
        cb(null, true)
    }
    else {
        cb(new Error('File not supported, allowed only jpeg and png files'));
    }
}

export const upload = (folderPath: string, resourceName: string) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, folderPath);
        },
        filename: (req, file, cb) => {
            const id = req.params?.id || 'generic';
            const ext = path.extname(file.originalname);
            cb(null, `${resourceName}-${id}-${Date.now()}${ext}`);
        }
    });
    return multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }
    });
}