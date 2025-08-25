const express= require('express');

const router = express.Router();
const authController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/update/:id', authMiddleware, authController.updateUser);
router.delete('/delete/:id', authMiddleware, authController.deleteUser);


module.exports=router;