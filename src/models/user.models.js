import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcript from "bcript";
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistroy: [{ type: Schema.type.ObjectId, ref: "Video" }],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//password encrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = bcript.hash(this.password, 10);
  next();
});

userSchema.method.isPasswordCorrect = async function (password) {
  return await bcript.compare(password, this.password);
};

userSchema.method.generateAccessTokens = function () {
  return jwt.sign(
    {
      //came form db
      _id: this._id,
      email: this.email,
      username: this.usename,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

userSchema.method.generateRefreshTokens = function () {
     return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};
export const User = mongoose.model("User", userSchema);
