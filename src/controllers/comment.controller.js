import  { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id ");
  }

  const pageNumber = Number(page);
  const pageSize = Number(limit);

  if (
    !Number.isInteger(pageNumber) ||  pageNumber < 1 ||
    !Number.isInteger(pageSize) || pageSize < 1
  ) {
    throw new ApiError(400, "page and limit must be positive number ");
  }

  const videoExists = await Video.exists({
    _id: videoId,
  })

  if (!videoExists) {
    throw new ApiError(404, "video not found ");
  }

 const comment=  await Comment.find(
    {
        video:videoId
    }
  ).sort({
    createdAt: -1,
  })
  .skip((pageNumber - 1)*pageSize)
  .limit(pageSize);

return res
.status(200)
.json(new ApiResponse(200,comment,"video's all comments are fetched"))
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;
  const { content } = req.body;

  if (typeof content !== "string" || content !== content.trim()) {
    throw new ApiError(400, "content is not in string or trimed form");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid video id");
  }

  const comment = await Comment.findOneAndUpdate(
    {
      owner: req.user?.id,
      _id: commentId,
    },
    {
      $set: {
        content: content.trim(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment update successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid video id");
  }

  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, " this comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
