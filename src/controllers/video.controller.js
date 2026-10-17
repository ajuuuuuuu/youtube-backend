import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  removeLocalFiles,
  deleteFromCloudinary,
} from "../utils/Cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "-1",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pageNumber = Number(page);
  const pageSize = Number(limit);

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new ApiError(400, "page and limit must be positive number ");
  }

  const filter = { isPublished: true };

  if (query) {
    const escapedQuery = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      {
        title: {
          $regex: escapedQuery,
          $options: "i",
        },
      },
      {
        description: { $regex: escapedQuery, $options: "i" },
      },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    filter.owner = userId;
  }

  const allowedSortFields = ["createdAt", "title", "views", "duration"];
  if (!allowedSortFields.includes(sortBy)) {
    throw new ApiError(400, "Invalid sortBy field");
  }

  const direction = Number(sortType);
  if (direction !== 1 && direction !== -1) {
    throw new ApiError(400, "sortType must be 1 or -1");
  }

  const [videos, totalVideos] = await Promise.all([
    Video.find(filter)
      .sort({ [sortBy]: direction })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Video.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page: pageNumber,
        limit: pageSize,
        totalVideos,
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  const localFilePaths = [videoLocalPath, thumbnailLocalPath].filter(Boolean);

  // TODO: get video, upload to cloudinary, create video

  if ([title, description].some((field) => !field || field?.trim() === "")) {
    await removeLocalFiles(localFilePaths);
    throw new ApiError(400, "all fields are required");
  }

  const existingVideo = await Video.findOne({ title });
  if (existingVideo) {
    await removeLocalFiles(localFilePaths);
    throw new ApiError(409, "A video with this title already exists");
  }

  if (!videoLocalPath || !thumbnailLocalPath) {
    await removeLocalFiles(localFilePaths);
    throw new ApiError(400, "Video file is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.public_id || !thumbnail?.public_id) {
    if (videoFile?.public_id) {
      await deleteFromCloudinary(videoFile.public_id, "video");
    }
    if (thumbnail?.public_id) {
      await deleteFromCloudinary(thumbnail.public_id, "image");
    }
    throw new ApiError(502, "Could not upload video and thumbnail");
  }

  const videoinfo = await Video.create({
    title: title || "",
    description: description || "",
    videoFile: videoFile?.url || "",
    videoFilePublicId: videoFile?.public_id,
    thumbnail: thumbnail?.url || "",
    thumbnailPublicId: thumbnail?.public_id,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  const createdVideo = await Video.findById(videoinfo._id).select("-owner");

  if (!createdVideo) {
    throw new ApiError(500, "Something went wrong while saving the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdVideo, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(404, "video id not found");
  }
  if (videoId) {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid videoId");
    }
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );

  if (!video) {
    throw new ApiError(404, "video not found ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  

  if (!isValidObjectId(videoId)) {
    removeLocalFiles([thumbnailLocalPath])
    throw new ApiError(400, "Invalid videoId");
  }

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    await removeLocalFiles([thumbnailLocalPath])
    throw new ApiError(400, "Title cannot be empty");
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || !description.trim())
  ) {
    await removeLocalFiles([thumbnailLocalPath])
    throw new ApiError(400, "Description cannot be empty");
  }

  if (title === undefined && description === undefined && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "Provide a title, description, or thumbnail to update"
    );
  }

  const video = await Video.findOne({
    $or: [{ _id: videoId }, { owner: req.user._id }],
  });

  if (!video) {
    await removeLocalFiles([thumbnailLocalPath])
    throw new ApiError(404, "Video not found");
  }

  if (title !== undefined) {
    const existingVideo = await Video.findOne({
      title: title.trim(),
      _id: { $ne: videoId },
    });

    if (existingVideo) {
      await removeLocalFiles([thumbnailLocalPath])
      throw new ApiError(409, "A video with this title already exists");
    }

    video.title = title.trim();
  }

  if (description !== undefined) {
    video.description = description.trim();
  }

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail?.url || !thumbnail?.public_id) {
      throw new ApiError(500, "Could not upload thumbnail");
    }

    video.thumbnail = thumbnail.url;
    video.thumbnailPublicId = thumbnail.public_id;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findOne({ _id: videoId, owner: req.user._id });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.videoFilePublicId || !video.thumbnailPublicId) {
    throw new ApiError(
      409,
      "This video is missing Cloudinary public IDs; backfill them before deleting"
    );
  }

  await deleteFromCloudinary(video.videoFilePublicId, "video");
  await deleteFromCloudinary(video.thumbnailPublicId, "image");

  await Video.findOneAndDelete({ _id: videoId, owner: req.user._id });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Video and Cloudinary assets deleted successfully"
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
