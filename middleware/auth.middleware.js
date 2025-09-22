const jwt = require("jsonwebtoken");
const Blacklist = require("../model/blackList.model"); // import your blacklist model
const UserModel = require("../model/user.model");


const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // 🔒 Check if token is blacklisted
    const blacklisted = await Blacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked. Please log in again.",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 Fetch full user from DB
    const user = await UserModel.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user doc & id
    req.user = user;        // full user document
    req.userId = user._id;  // handy shortcut

    next();
  } catch (error) {
    console.error("❌ Error in auth middleware:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

module.exports = authMiddleware;




// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "No token, authorization denied",
//       });
//     }

//     // 🔒 Check if token is blacklisted
//     const blacklisted = await Blacklist.findOne({ token });
//     if (blacklisted) {
//       return res.status(401).json({
//         success: false,
//         message: "Token has been revoked. Please log in again.",
//       });
//     }

//     try {
//       // ✅ Verify token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Attach user info to request
//       req.user = decoded;
//       req.userId = decoded.id || decoded._id;

//       next();
//     } catch (error) {
//       return res.status(401).json({
//         success: false,
//         message: "Token is not valid",
//       });
//     }
//   } catch (error) {
//     console.error("Error in auth middleware:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };

// module.exports = authMiddleware;


