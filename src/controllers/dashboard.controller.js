import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const [videoIds,totalSubscribers, videoStats] = await Promise.all([
        Video.distinct("_id",{
            owner:req.user._id
        }),
        Subscription.countDocuments({
            channel:req.user._id
        }),
        Video.aggregate([
            {
                $match:{
                    owner:req.user._id
                }
            },
            {
                $group:{
                    _id:null,
                    totalVideos:{
                        $sum:1
                    },
                    totalViews:{
                        $sum:"$views"
                    }
                }
            }
        ])
    ])
    
    const totalLikes = await Like.countDocuments({
        Video:{
            $in:videoIds
        }
    })

    const {totalVideos=0 ,totalViews = 0}= videoStats[0] ?? {};

    
    return res
    .status(200)
    .json(new ApiResponse(200,
        {
            totalViews, totalSubscribers,
            totalVideos,totalLikes
        },
        "Channel stats fetched successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.find({
        owner:req.user._id
    }).sort({
        cretedAt:-1
    })

    if(!videos){
        throw new ApiError(404,"videos not found")
    }


return res
.status(200)
.json(new ApiResponse(200,videos,"channel video fetched successfully"))


})
export {
    getChannelStats, 
    getChannelVideos
    }