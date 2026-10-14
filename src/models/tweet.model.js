import mongoose ,{Schema}from "mongoose";


const tweetSchema = new Schema({

    content :{
        type:String,
        reqired:true
    },
    owner:{
        type:Object.Type.ObjectId,
        ref:"Owner"
    }
},{timestamps:true})

export const Tweet  = mongoose.model("Tweet",tweeetSchema)