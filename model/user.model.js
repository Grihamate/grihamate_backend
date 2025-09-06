const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    isSubscribed: { type: Boolean, default: false },
  }
);

module.exports = mongoose.model("User", UserSchema);
