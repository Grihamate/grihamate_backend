// ./controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/user.model");
const nodemailer = require("nodemailer");
const Blacklist = require("../model/blackList.model");
const sendEmail = require("../services/sendEmail")


const registerUser = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;
    if (!fullname || !email  || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }]});
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ fullname ,email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id,  fullname: user.fullname, email: user.email, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: { id: user._id, fullname: user.fullname,  email: user.email, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(400).json({ message: "Token not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save token in blacklist until it expires
    await Blacklist.create({
      token,
      expiresAt: new Date(decoded.exp * 1000) // JWT exp is in seconds
    });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updatedUser = await UserModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User updated successfully",
      user: { id: updatedUser._id, fullname: updatedUser.fullname,phone: updatedUser.phone },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await UserModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getUserProfile=async(req,res)=>{

  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User profile retrieved successfully",
      user: { id: user._id, fullname: user.fullname,email:user.email, phone: user.phone, my_properties: user.my_properties,my_sell_properties: user.my_sell_properties, booking_history:user.booking_history  },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getInTouch = async (req, res) => {
  const { fullname, email, phone, message } = req.body;

  if (!fullname || !email || !phone || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_COMPANY,  
      pass: process.env.GMAIL_PASS   
    }
  });

  const mailOptions = {
    from: email,  
    to: process.env.GMAIL_COMPANY,    
    replyTo: email,                
    subject: 'New Get In Touch Form Submission',
    text: `
      Name: ${fullname}
      Email: ${email}
      Phone: ${phone}
      Message: ${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message." });
  }
};



///////////////////////////////////////////////////////////////////////////////////////////////////
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    
    const resetLink = `https://grihamate-frontend-vite-repo.vercel.app/resetpassword/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_COMPANY,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to: email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset link." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { newpassword, confirmpassword } = req.body;

    if (!newpassword || !confirmpassword) {
      return res.status(400).json({ message: "Both new password and confirm password are required." });
    }

    if (newpassword !== confirmpassword) {
      return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    await UserModel.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    return res.status(200).json({ message: "Password has been reset successfully." });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};




const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Your email is not registered with us yet" });
    }

    if (user.isSubscribed) {
      // Already subscribed → send reminder email
      await sendEmail(
        user.email,
        "Already Subscribed",
        "<h1>You are already subscribed!</h1><p>You will continue to get updates from our team.</p>"
      );

      return res.status(200).json({
        success: true,
        message: "User already subscribed, reminder email sent",
      });
    }

    // If not subscribed, update
    user.isSubscribed = true;
    await user.save();

    await sendEmail(
      user.email,
      "Subscription Confirmation",
      "<h1>Thank you for subscribing!</h1><p>You will now receive updates about our properties.</p>"
    );

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      user: { email: user.email, isSubscribed: user.isSubscribed },
    });
  } catch (error) {
    console.error("Error in subscribeNewsletter:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to subscribe" });
  }
};





// const bookSite = async (req, res) => {
//   try {
//     const COMPANY_EMAIL = process.env.GMAIL_COMPANY;

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.GMAIL_COMPANY,
//         pass: process.env.GMAIL_PASS,
//       },
//     });

//     const userId = req.userId;

//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const { email, fullname, phone } = user;
//     const message = "A user has expressed interest in scheduling a site visit through the platform.";
//     // Email to User
//     const userMailOptions = {
//       from: COMPANY_EMAIL,
//       to: email,
//       subject: "Your Site Visit Appointment is Confirmed!",
//       html: `
//         <h2>Dear ${fullname},</h2>
//         <p>Your site visit appointment has been <strong>successfully confirmed</strong>.</p>
//         <p>We will send you the exact <strong>date and time</strong> soon.</p>
//         <p>Thank you for choosing us!</p>
//         <br/>
//         <p>Best regards,<br/>Team Grihamate</p>
//       `,
//     };

//     const MAIN_EMAIL = process.env.MAIN_GMAIL_COMPANY;
//     // Email to Company
//     const companyMailOptions = {
//       from: COMPANY_EMAIL,
//       to: MAIN_EMAIL,
//       subject: "New Site Visit Booking Received",
//       html: `
//         <h3>New Site Visit Booking</h3>
//         <p><b>Name:</b> ${fullname}</p>
//         <p><b>Email:</b> ${email}</p>
//         <p><b>Phone:</b> ${phone}</p>
//         <p><b>Message:</b> ${message}</p>
//       `,
//     };

//     await transporter.sendMail(userMailOptions);
//     await transporter.sendMail(companyMailOptions);

//     return res.status(200).json({
//       success: true,
//       message: "Site visit confirmed. Emails sent.",
//     });
//   } catch (error) {
//     console.error("Email sending error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while booking the site visit.",
//        error: error.message 
//     });
//   }
// };
// Controller
const bookSite = async (req, res) => {
  try {
    const COMPANY_EMAIL = process.env.GMAIL_COMPANY;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_COMPANY,
        pass: process.env.GMAIL_PASS,
      },
    });

    const userId = req.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { email, fullname, phone } = user;

    // 🔥 Get propertyId from URL params
    const propertyId = req.params.propertyId;

    // ✅ Save to user's booking history
    if (propertyId) {
      user.booking_history.push(propertyId);
      await user.save();
    }

    const message = "A user has expressed interest in scheduling a site visit through the platform.";

    const userMailOptions = {
      from: COMPANY_EMAIL,
      to: email,
      subject: "Your Site Visit Appointment is Confirmed!",
      html: `
        <h2>Dear ${fullname},</h2>
        <p>Your site visit appointment has been <strong>successfully confirmed</strong>.</p>
        <p>We will send you the exact <strong>date and time</strong> soon.</p>
        <p>Thank you for choosing us!</p>
        <br/>
        <p>Best regards,<br/>Team Grihamate</p>
      `,
    };

    const companyMailOptions = {
      from: COMPANY_EMAIL,
      to: process.env.MAIN_GMAIL_COMPANY,
      subject: "New Site Visit Booking Received",
      html: `
        <h3>New Site Visit Booking</h3>
        <p><b>Name:</b> ${fullname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Property ID:</b> ${propertyId}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(companyMailOptions);

    return res.status(200).json({
      success: true,
      message: "Site visit confirmed. Emails sent and booking saved.",
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while booking the site visit.",
      error: error.message,
    });
  }
};




module.exports = {
  getUserProfile,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getInTouch,
  forgotPassword,
  resetPassword,
  logoutUser,
  subscribeNewsletter,
  bookSite

};
