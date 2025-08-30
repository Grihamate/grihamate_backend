const express= require('express');

const router = express.Router();
const authController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authMiddleware, authController.logoutUser);
router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/update/:id', authMiddleware, authController.updateUser);
router.delete('/delete/:id', authMiddleware, authController.deleteUser);
router.post('/getintouch', authController.getInTouch);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword', authController.resetPassword);





module.exports=router;