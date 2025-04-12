import cloudinary from "../cloudinaryConfig";
import {Readable} from 'stream';
import { UploadApiResponse } from "cloudinary";

async function bufferToStream(buffer: Buffer): Promise<Readable> {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

async function cloudinaryImageUpload (file: Buffer): Promise<string> {
    try{
        const uploadResult: UploadApiResponse = await new Promise((resolve, reject)=>{
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "itclubweb",
                resource_type: "auto",
                public_id: `${Date.now().toString()}_screenshot`,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
            }
        );
        bufferToStream(file).then((stream) => stream.pipe(uploadStream));
        })
        
        return uploadResult.secure_url;
    }
    catch(error)
    {
        console.error("Error uploading image to Cloudinary:", error);
        throw error;
    }
}

export default cloudinaryImageUpload;