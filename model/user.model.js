const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    isSubscribed: { type: Boolean, default: false },
    
    my_properties: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Property" 
      }
    ],

    my_sell_properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SellProperty"
      }
    ],
    booking_history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
      }
    ]

  },
  { timestamps: true }

);

module.exports = mongoose.model("User", UserSchema);
