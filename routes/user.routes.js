const express= require('express');

const router = express.Router();
const authController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.get('/booking', authMiddleware, authController.bookingHistory);
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authMiddleware, authController.logoutUser);
router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/update/:id', authMiddleware, authController.updateUser);
router.delete('/delete/:id', authMiddleware, authController.deleteUser);
router.post('/getintouch', authController.getInTouch);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword', authController.resetPassword);
router.post('/subscribe', authController.subscribeNewsletter);
// router.post('/bookvisit', authMiddleware, authController.bookSite);
router.post('/bookvisit/:propertyId', authMiddleware, authController.bookSite);






module.exports=router;