// ./controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/user.model");
const nodemailer = require("nodemailer");


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
      user: { id: updatedUser._id, fullname: updatedUser.fullname, phone: updatedUser.phone },
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
      user: { id: user._id, fullname: user.fullname, phone: user.phone },
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

    
    const resetLink = `http://localhost:5000/resetpassword/${token}`;

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




///////////////////////////////////////////////////////////////////////////////




module.exports = {
  getUserProfile,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getInTouch,
  forgotPassword,
  resetPassword

};
