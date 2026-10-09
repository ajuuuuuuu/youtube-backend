import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

//configuaration
const storage = multer.diskStorage({
    destination : function(req,file,cb){
        cb(null, "./public/temp")
    },
    filename:function (req, file, cb){
        cb(null, `${randomUUID()}${extname(file.originalname)}`)
        }

})

export const upload = multer({storage })