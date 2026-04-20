import path from "path"
import fs from "fs"
import multer from "multer";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { logger } from "@/config/logger";
import { env } from "@/config/env";
import { BadRequestError } from "@/common/errors";
import { fileTypeFromFile } from "file-type";

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(`File type ${file.mimetype} not supported`));
    }
}

export class ImagesService {
    private uploader: multer.Multer
    private resource: string

    private folderPath: string
    public static rootPath = env.FILE_BASE_PATH;
    public static uploadsPath = path.join(ImagesService.rootPath, "public/uploads");

    constructor(folderName: string, resource: string) {
        this.folderPath = path.join(ImagesService.uploadsPath, folderName);
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

    private async verifyRealFileType(filePath: string): Promise<boolean> {
        try {
            const type = await fileTypeFromFile(filePath);
            if (!type || !ALLOWED_MIMES.includes(type.mime)) {
                return false;
            }
            return true;
        } catch (error) {
            logger.error("Error verifying file type:", error);
            return false;
        }
    }

    public upload(): RequestHandler[] {
        return [
            this.uploader.single('image'),

            async (req: Request, res: Response, next: NextFunction) => {
                if (!req.file) return next();

                const isReal = await this.verifyRealFileType(req.file.path);

                if (!isReal) {
                    fs.unlinkSync(req.file.path);
                    return next(new BadRequestError("Security check failed: file content does not match extension."));
                }
                next();
            }
        ];
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