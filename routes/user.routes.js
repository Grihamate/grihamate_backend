const express= require('express');

const router = express.Router();
const authController = require('../controllers/user.controller');


router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.put('/update/:id', authController.updateUser);
router.delete('/delete/:id', authController.deleteUser);


module.exports=router;