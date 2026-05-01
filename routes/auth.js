const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email });
        }
        
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: 'Your Login OTP',
            text: `Your OTP for login is: ${otp}. It expires in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true;
        await user.save();

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
});

module.exports = router;
