import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { unlink } from "node:fs/promises"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }


}

const removeLocalFiles = async (localFilePaths) => {
    await Promise.all(
        localFilePaths.filter(Boolean).map((filePath) => unlink(filePath))
    )
}

const deleteFromCloudinary = async (publicId, resourceType) => {
    if (!publicId) {
        throw new Error("Cloudinary public ID is required")
    }

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
    })

    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary asset deletion failed: ${result.result}`)
    }

    return result
}

export {uploadOnCloudinary, removeLocalFiles, deleteFromCloudinary}