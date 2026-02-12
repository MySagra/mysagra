import path from "path"
import fs from "fs"
import multer from "multer";
import { Request, RequestHandler } from "express";
import { logger } from "@/config/logger";

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

export class ImageService {
    private uploader: multer.Multer
    private resource: string

    private folderPath: string
    public static rootPath = process.cwd();
    public static uploadsPath = path.join(ImageService.rootPath, "public/uploads");

    constructor(folderName: string, resource: string) {
        this.folderPath = path.join(ImageService.uploadsPath, folderName);
        this.resource = resource;

        if (!fs.existsSync(this.folderPath)) {
            try {
                fs.mkdirSync(this.folderPath, { recursive: true });
            } catch (err) {
                console.error("Errore creazione folderPath:", err);
            }
        }

        this.uploader = multer({
            storage: this.createStorage(),
            fileFilter,
            limits: { fileSize: 5 * 1024 * 1024 } // max 5MB
        })
    }

    private createStorage(): multer.StorageEngine {
        const folderPath = this.folderPath;
        return multer.diskStorage({
            destination: (req: Request, file: Express.Multer.File, cb) => {
                return cb(null, folderPath);
            },
            filename: (req: Request, file: Express.Multer.File, cb) => {
                const id = req.params?.id
                const ext = path.extname(file.originalname);
                cb(null, `${this.resource}-${id}-${Date.now()}${ext}`);
            }
        })
    }

    public upload(): RequestHandler {
        return this.uploader.single('image');
    }

    public delete(fileName: string) {
        const filePath = path.join(this.folderPath, fileName);
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.warn(`Image in ${filePath} already deleted:`, err);
            } else {
                logger.info(`File ${filePath} deleted successfully.`);
            }
        });
    }
}