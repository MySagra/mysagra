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
    private folderPath: string
    private uploader: multer.Multer
    private resource: string

    constructor(folderName: string, resource: string) {
        this.folderPath = path.join(__dirname, `../../public/uploads/${folderName}`);
        this.resource = resource;

        const uploadsPath = path.join(__dirname, "../../public/uploads");
        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
        }

        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
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

    public upload() : RequestHandler {
        return this.uploader.single('image');
    }

    public delete(fileName: string) {
        const filePath = path.join(this.folderPath, fileName);
        fs.unlink(filePath, (err) => {
            if (err) {
                logger.error(`Error deleting file ${filePath}:`, err);
            } else {
                logger.info(`File ${filePath} deleted successfully.`);
            }
        });
    }
}