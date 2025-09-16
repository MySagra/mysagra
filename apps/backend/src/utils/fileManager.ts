import fs from 'fs'
import path from 'path';

export function deleteFile(path: string, fileName: string){
    const filePath = `${path}/${fileName}`;
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
    }
}

export function getUploadsPath(){
    return path.join(__dirname, `../../public/uploads`);
}