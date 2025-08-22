const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const axios = require("axios");
const mongoose = require('mongoose');
const verifyToken = require('../k6/verifyToken'); // path may vary
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const OdinCircledbModel = require('../models/odincircledb');
const WalletModel = require('../models/Walletmodel');
const AddTimeLog = require('../models/AddTimeLog');
const TopUpModel = require('../models/TopUpModel');
const DebitModel = require('../models/DebitModel');
const DebitModelToo = require('../models/DebitModelToo');
const ChatModel = require('../models/ChatModel');
const ChatMessage = require('../models/ChatMessage');
const BetIntent = require('../models/BetIntent');
const UserOtpVerification = require('../models/UserOtpVerify');
const  UnverifiedUser = require('../models/UnverifiedUser');
const TransOtpVerify = require('../models/TransOtpVerify');
const BankModel = require('../models/BankModel');
const WithdrawAuthModel = require("../models/WithdrawAuthModel")
// const verifyWithdrawalOtp = require('../k6/verifyWithdrawalOtp'); // Add this at top
const VirtualAccountModel = require("../models/VirtualAccountModel");
const WinnerModel = require("../models/WinnerModel");
const LoserModel = require("../models/LoserModel");
const TictactoeModel = require("../models/BetCashModel");
const DeleteRequestModel = require('../models/DeleteRequestModel');
const ReferralModel = require('../models/ReferralModel');
const { v4: uuidv4 } = require('uuid'); // To generate unique referral codes
const jwtSecret = process.env.JWT_SECRET;
// Parse the EMAIL_USER AND EMAIL_PASS environment variable
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const multer = require('multer');
const Device = require('../models/Device');
const UserFriendsModel = require('../models/UserFriendsModel');
const ChatsFriends = require('../models/ChatsFriends');
const TransOtpVerificationModel = require('../models/TransOtpVerify');
const BetModel = require('../models/BetModel');
const BetModelCoin = require('../models/BetModelCoin');
const BetModelDice = require('../models/BetModelDice');
const BetModelQuiz = require('../models/BetModelQuiz');
const BetModelRock = require('../models/BetModelRock');
const QuestionModel = require('../models/QuestionModel');
const WithdrawOnceModel = require('../models/WithdrawOnceModel');
const BatchAnswer = require('../models/BatchAnswerModel');
const cloudinary = require('cloudinary').v2;
const { Expo } = require('expo-server-sdk');
const BatchModel = require('../models/BatchModel');
const FaceOffModel = require('../models/FaceOffModel');
const FaceOffAnswer = require('../models/FaceOffAnswerModel');
const expo = new Expo();

const { ObjectId } = require('mongoose').Types;

// Configure multer for file upload handling
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage });

// Configure Cloudinary properly
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,  // Correct syntax
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


const router = express.Router();

// Generate a short referral code by trimming the UUID
const generateReferralCode = () => {
  return uuidv4().slice(0, 6); // For a 6-character code
};


// Define rate limiting rules
const registrationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 5 registration requests per windowMs
  message: 'Too many registration attempts from this IP, please try again after 5 minutes',
});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;


const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL;
const PAYSTACK_BASE = process.env.PAYSTACK_BASE;

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
};

// router.post('/api/wallet/deduct', async (req, res) => {
//   const { userId, amount } = req.body;

//   if (!userId || !amount) {
//     return res.status(400).json({ error: 'Missing userId or amount' });
//   }

//   try {
//     const user = await OdinCircledbModel.findById(userId);
//     if (!user || !user.wallet) {
//       return res.status(404).json({ error: 'User not found or wallet missing' });
//     }

//     if (user.wallet.balance < amount) {
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     user.wallet.balance -= amount;
//     await user.save();

//     res.json({
//       success: true,
//       message: `₦${amount} deducted successfully`,
//       newBalance: user.wallet.balance,
//     });
//   } catch (err) {
//     console.error('💥 Error deducting balance:', err);
//     res.status(500).json({ error: 'Server error while deducting balance' });
//   }
// });

router.post('/api/wallet/deduct', async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'Missing userId or amount' });
  }

  try {
    const user = await OdinCircledbModel.findById(userId);
    if (!user || !user.wallet) {
      return res.status(404).json({ error: 'User not found or wallet missing' });
    }

    const deductionAmount = parseFloat(amount);
    if (isNaN(deductionAmount) || deductionAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deduction amount' });
    }

    if (user.wallet.balance < deductionAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance
    user.wallet.balance -= deductionAmount;
    await user.save();

    // Save usage log
    await new AddTimeLog({ userId, cost: deductionAmount }).save();

    res.json({
      success: true,
      message: `₦${deductionAmount} deducted successfully`,
      newBalance: user.wallet.balance,
    });

  } catch (error) {
    console.error('Error deducting from wallet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// GET /userwinner/:userId?page=1&limit=10
router.get('/userwinner/:userId', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const wins = await WinnerModel.find({ winnerName: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await WinnerModel.countDocuments({ winnerName: req.params.userId });

    res.json({ data: wins, total });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wins' });
  }
});

// GET /userloser/:userId?page=1&limit=10
router.get('/userloser/:userId', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const losses = await LoserModel.find({ loserName: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await LoserModel.countDocuments({ loserName: req.params.userId });

    res.json({ data: losses, total });
  } catch (error) {
    console.error('Error fetching losses:', error);
    res.status(500).json({
      message: 'Error fetching losses',
      error: error.message
    });
  }
});

// ✅ GET user by ID — return email, username, wallet balance, etc.
router.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await OdinCircledbModel.findById(userId).select('email fullName wallet image');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/verify-otpwithdraw', async (req, res) => {
  const { userId, otp, totalAmount } = req.body;

  try {
    // 1️⃣ Check OTP
    const otpRecord = await TransOtpVerify.findOne({ userId, otp });
    if (!otpRecord) {
      return res.status(400).send('Invalid OTP');
    }

    // 2️⃣ Fetch User
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(400).send('User not found');
    }

    // 3️⃣ Validate Amount
    const withdrawalAmount = parseFloat(totalAmount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).send('Invalid amount');
    }

    // 4️⃣ Check Balance
    if (user.wallet.cashoutbalance < withdrawalAmount) {
      return res.status(400).send('Insufficient balance');
    }

    // 5️⃣ Clear OTP
    await TransOtpVerify.deleteOne({ userId, otp });

    // ✅ Success
    return res.status(200).json({
      message: 'OTP verified successfully. Sufficient balance confirmed.',
    });

  } catch (error) {
    console.error('Error during OTP verification:', error.message);
    return res.status(500).json({
      message: 'An error occurred during the OTP verification process.',
      error: error.message,
    });
  }
});


// const verifyWithdrawalOtp = async ({ userId, otp, totalAmount, amount, title, message, fullName }) => {

//   const otpRecord = await TransOtpVerify.findOne({ userId, otp });
//  if (!otpRecord) throw new Error('Invalid or expired OTP');

//   const user = await OdinCircledbModel.findById(userId);
//   if (!user) throw new Error('User not found');

//   const withdrawalAmount = parseFloat(totalAmount);
//   if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
//     throw new Error('Invalid amount');
//   }

//   if (user.wallet.cashoutbalance < withdrawalAmount) {
//     throw new Error('Insufficient balance');
//   }

//   user.wallet.cashoutbalance -= withdrawalAmount;
//   await user.save();

//   const transaction = new DebitModel({
//     userId,
//     amount,
//     fullName,
//     WithdrawStatus: 'success',
//     date: new Date(),
//   });

//     const transactionToo = new DebitModelToo({
//     userId,
//     amount,
//     fullName,
//     WithdrawStatus: 'success',
//     date: new Date(),
//   });
  
//   await transaction.save();
//     await transactionToo.save();

//   await TransOtpVerify.deleteOne({ userId, otp });

//   // ✅ Send Email
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'odincirclex@gmail.com',
//       pass: 'xyqi telz pmxd evkl', // Make sure this is an app password, not your Gmail password
//     },
//   });

//  const emailOptions = {
//   from: 'odincirclex@gmail.com',
//   to: user.email,
//   subject: 'Withdrawal Notification',
//   html: `
// <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px; max-width: 520px; margin: 0 auto; border-radius: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.05);">
//   <!-- Header -->
//   <div style="background-color: #111; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
//     <h2 style="margin: 0; font-size: 17px; color: #fff;">Withdrawal Successful</h2>
//   </div>

//   <!-- Body -->
//   <div style="background-color: #fff; padding: 24px; border-radius: 0 0 12px 12px; color: #222;">
//     <p style="font-size: 15px; margin: 0 0 16px;">Hi <strong>${user.fullName}</strong>,</p>

//     <p style="font-size: 15px; text-align: center; margin-bottom: 20px;">
//       ₦<strong>${withdrawalAmount.toFixed(2)}</strong> has been sent to your account.
//     </p>

//     <div style="background-color: #f0f0f0; padding: 14px 18px; border-radius: 8px; font-size: 14px;">
//       <div><strong>ID:</strong> ${transaction._id}</div>
//       <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
//       <div><strong>Status:</strong> <span style="color:#111;">Success</span></div>
//     </div>

//     <p style="font-size: 13px; color: #666; margin-top: 24px; text-align: center;">
//       Need help? <a href="mailto:odincirclex@gmail.com" style="color: #333; text-decoration: underline;">Contact Support</a>
//     </p>
//   </div>
// </div>
// `,
// };


//   await transporter.sendMail(emailOptions);

//   // ✅ Send Notification
//   const device = await Device.findOne({ users: { $elemMatch: { _id: userId } } });
//   if (!device) throw new Error('Device not found.');

//   if (!Expo.isExpoPushToken(device.expoPushToken)) {
//     throw new Error('Invalid Expo Push Token');
//   }

//   const notificationMessage = {
//     to: device.expoPushToken,
//     sound: 'default',
//     title: title || 'Withdrawal Notification',
//     body:  message || `Your withdrawal of NGN ${withdrawalAmount.toFixed(2)} was successful`,
//   };

//   const chunks = expo.chunkPushNotifications([notificationMessage]);
//   const tickets = [];

//   for (const chunk of chunks) {
//     try {
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       tickets.push(...ticketChunk);
//     } catch (err) {
//       console.error('Error sending notification chunk:', err);
//       throw new Error('Notification failed to send.');
//     }
//   }

//   return {
//     message: 'Withdrawal verified, email and notification sent successfully.',
//     transactionId: transaction._id,
//     tickets,
//   };
// };


// router.post("/paystack/withdraw", async (req, res) => {
//   const {
//     name,
//     account_number,
//     bank_name,
//     amount,
//     currency,
//     otp,
//     totalAmount,
//     userId,
//     title,
//     message,
//     fullName
//   } = req.body;

//   if (!name || !account_number || !bank_name || !amount || !userId) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     // ✅ Step 1: Verify OTP before making any Paystack request
//     const otpVerificationResult = await verifyWithdrawalOtp({
//       userId,
//       otp,
//       totalAmount,
//       amount,
//       title,
//       message,
//       fullName,
//     });

//     // ✅ Step 2: Find the bank code from Paystack
//     const bankResponse = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
//       headers: paystackHeaders,
//     });

//     const bank = bankResponse.data.data.find(
//       (b) => b.name.toLowerCase() === bank_name.toLowerCase()
//     );

//     if (!bank) {
//       return res.status(400).json({ error: "Bank not found" });
//     }

//     // ✅ Step 3: Create transfer recipient
//     const recipientResponse = await axios.post(
//       `${PAYSTACK_BASE_URL}/transferrecipient`,
//       {
//         type: "nuban",
//         name,
//         account_number,
//         bank_code: bank.code,
//         currency: currency || "NGN",
//       },
//       { headers: paystackHeaders }
//     );

//     const recipient_code = recipientResponse.data.data.recipient_code;

//     // ✅ Step 4: Initiate transfer
//     const transferResponse = await axios.post(
//       `${PAYSTACK_BASE_URL}/transfer`,
//       {
//         source: "balance",
//         amount: parseInt(amount) * 100, // convert to kobo
//         recipient: recipient_code,
//         reason: "Withdrawal",
//       },
//       { headers: paystackHeaders }
//     );

//     // ✅ Step 5: Respond to client
//     res.json({
//       success: true,
//       message: "Withdrawal successfully completed",
//       transferData: transferResponse.data.data,
//       ...otpVerificationResult,
//     });
//   } catch (error) {
//     console.error("Withdrawal error:", error.response?.data || error.message);
//     res.status(500).json({
//       error: "Withdrawal process failed",
//       details: error.response?.data?.message || error.message,
//     });
//   }
// });

router.post("/paystack/withdraw", async (req, res) => {
  const {
    name,
    account_number,
    bank_name,
    amount,
    currency,
    otp,
    totalAmount,
    userId,
    title,
    message,
    fullName
  } = req.body;

  if (!name || !account_number || !bank_name || !amount || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // ✅ Step 1: OTP + Balance Check (no deduction yet)
    await verifyWithdrawalOtpOnly({ userId, otp, totalAmount });

    // ✅ Step 2: Get bank code from Paystack
    const bankResponse = await axios.get(`${PAYSTACK_BASE_URL}/bank`, { headers: paystackHeaders });
    const bank = bankResponse.data.data.find(
      (b) => b.name.toLowerCase() === bank_name.toLowerCase()
    );

    if (!bank) {
  return res.status(400).json({ message: "Bank not found" });
   }


    // ✅ Step 3: Create transfer recipient
    const recipientResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type: "nuban",
        name,
        account_number,
        bank_code: bank.code,
        currency: currency || "NGN",
      },
      { headers: paystackHeaders }
    );
    const recipient_code = recipientResponse.data.data.recipient_code;

    // ✅ Step 4: Initiate transfer
    const transferResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: "balance",
        amount: parseInt(amount) * 100, // kobo
        recipient: recipient_code,
        reason: "Withdrawal",
      },
      { headers: paystackHeaders }
    );

    // ✅ Step 5: Deduct funds ONLY now
    await finalizeWithdrawal({
      userId,
      totalAmount,
      amount,
      fullName,
      title,
      message
    });

  res.status(200).json({
  success: true,
  message: "Withdrawal successfully completed",
  transferData: transferResponse.data.data
});

  } catch (error) {
    console.error("Withdrawal error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Withdrawal process failed",
      details: error.response?.data?.message || error.message,
    });
  }
});

async function verifyWithdrawalOtpOnly({ userId, otp, totalAmount }) {
  const otpRecord = await TransOtpVerify.findOne({ userId, otp });
  if (!otpRecord) throw new Error('Invalid or expired OTP');

  const user = await OdinCircledbModel.findById(userId);
  if (!user) throw new Error('User not found');

  const withdrawalAmount = parseFloat(totalAmount);
  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    throw new Error('Invalid amount');
  }

  if (user.wallet.cashoutbalance < withdrawalAmount) {
    throw new Error('Insufficient balance');
  }

  // Delete OTP now to prevent reuse
  await TransOtpVerify.deleteOne({ userId, otp });
}

async function finalizeWithdrawal({ userId, totalAmount, amount, fullName, title, message }) {
  const user = await OdinCircledbModel.findById(userId);
  if (!user) throw new Error('User not found');

  // Deduct funds
  user.wallet.cashoutbalance -= parseFloat(totalAmount);
  await user.save();

  // Save transaction in both models
  const transaction = new DebitModel({
    userId,
    amount,
    fullName,
    WithdrawStatus: 'success',
    date: new Date(),
  });
  const transactionToo = new DebitModelToo({
    userId,
    amount,
    fullName,
    WithdrawStatus: 'success',
    date: new Date(),
  });

  await transaction.save();
  await transactionToo.save();

  // ---- Send Email ----
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'odincirclex@gmail.com',
      pass: 'xyqi telz pmxd evkl', // App password
    },
  });

  const emailOptions = {
    from: 'odincirclex@gmail.com',
    to: user.email,
    subject: 'Withdrawal Notification',
    html: `
<div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px; max-width: 520px; margin: 0 auto; border-radius: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.05);">
  <div style="background-color: #111; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
    <h2 style="margin: 0; font-size: 17px; color: #fff;">Withdrawal Successful</h2>
  </div>
  <div style="background-color: #fff; padding: 24px; border-radius: 0 0 12px 12px; color: #222;">
    <p style="font-size: 15px; margin: 0 0 16px;">Hi <strong>${user.fullName}</strong>,</p>
    <p style="font-size: 15px; text-align: center; margin-bottom: 20px;">
      ₦<strong>${parseFloat(totalAmount).toFixed(2)}</strong> has been sent to your account.
    </p>
    <div style="background-color: #f0f0f0; padding: 14px 18px; border-radius: 8px; font-size: 14px;">
      <div><strong>ID:</strong> ${transaction._id}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
      <div><strong>Status:</strong> <span style="color:#111;">Success</span></div>
    </div>
    <p style="font-size: 13px; color: #666; margin-top: 24px; text-align: center;">
      Need help? <a href="mailto:odincirclex@gmail.com" style="color: #333; text-decoration: underline;">Contact Support</a>
    </p>
  </div>
</div>
`,
  };

  await transporter.sendMail(emailOptions);

  // ---- Send Push Notification ----
  const device = await Device.findOne({ users: { $elemMatch: { _id: userId } } });
  if (!device) throw new Error('Device not found.');

  if (!Expo.isExpoPushToken(device.expoPushToken)) {
    throw new Error('Invalid Expo Push Token');
  }

  const notificationMessage = {
    to: device.expoPushToken,
    sound: 'default',
    title: title || 'Withdrawal Notification',
    body: message || `Your withdrawal of NGN ${parseFloat(totalAmount).toFixed(2)} was successful`,
  };

  const chunks = expo.chunkPushNotifications([notificationMessage]);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error('Error sending notification chunk:', err);
      throw new Error('Notification failed to send.');
    }
  }

  return {
    message: 'Withdrawal finalized, email and notification sent successfully.',
    transactionId: transaction._id,
    tickets,
  };
}


   router.get('/verify-bankName', async (req, res) => {
  const { accountNumber, bankCode } = req.query;
  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(400).json({ message: 'Unable to verify account', error: err.message });
  }
});

     router.post("/paystack/finalize-withdrawal",verifyToken, async (req, res) => {
  const { transfer_code, otp, userId, amount, fullName } = req.body;

  if (!transfer_code || !otp || !userId || !amount || !fullName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Send OTP and transfer code to Paystack to finalize the withdrawal
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer/finalize_transfer`,
      { transfer_code, otp },
      { headers: paystackHeaders }
    );

    //console.log("Paystack Response:", response.data); // Log the full response

    // Check if the transfer was at least queued
    if (response.data.status === true && response.data.data.status === "pending") {
      console.log("Transfer is pending, proceeding with wallet deduction...");

      // Fetch user
      const user = await OdinCircledbModel.findById(userId);
      if (!user) {
        console.error("User not found:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure wallet exists
      if (!user.wallet || typeof user.wallet.cashoutbalance !== "number") {
        console.error("User wallet not found or invalid:", user.wallet);
        return res.status(500).json({ error: "User wallet not available" });
      }

      // Convert amount to a number
      const withdrawalAmount = Number(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        console.error("Invalid withdrawal amount:", amount);
        return res.status(400).json({ error: "Invalid withdrawal amount" });
      }

      // Check if user has enough balance
      if (user.wallet.cashoutbalance < withdrawalAmount) {
        console.error("Insufficient balance:", user.wallet.cashoutbalance, "Requested:", withdrawalAmount);
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct the amount from the wallet
      user.wallet.cashoutbalance -= withdrawalAmount;
      await user.save();

      // console.log(`New balance after withdrawal: ${user.wallet.cashoutbalance}`);

      // Save the transaction record
      const transaction = new DebitModel({
        userId,
        amount: withdrawalAmount,
        fullName,
        WithdrawStatus: "pending", // Still pending since Paystack hasn't completed it
        date: new Date(),
      });
      await transaction.save();

      // console.log("Transaction saved successfully:", transaction);

      return res.json({
        success: true,
        message: "Withdrawal request has been queued successfully.",
      });
    } else {
      console.error("OTP verification failed:", response.data);
      return res.status(400).json({ error: "OTP verification failed. Please try again." });
    }
  } catch (error) {
    console.error("Error finalizing transfer:", error.response?.data || error);
    return res.status(500).json({ error: "Failed to finalize withdrawal" });
  }
});



router.post('/paystack/initialize', async (req, res) => {
  const { email, amount, userId } = req.body;
  const paystackAmount = amount * 100; // Convert to kobo

  // console.log("Received payment request:", { email, amount });

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { email, 
       amount: paystackAmount ,
       callback_url: `${PAYSTACK_BASE}/paystack/callback`, // ✅ Change to an actual callback route
       metadata: { userId } // ✅ Attach userId to be retrieved later
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    // console.log("Paystack response:", response.data);

    res.json(response.data);
  } catch (error) {
    console.error("Error initializing transaction:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Transaction initialization failed' });
  }
});



// Callback URL for Paystack
router.get("/paystack/callback", async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: "No reference provided" });

    // Verify the transaction
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const { status, data } = response.data;
    if (status && data.status === "success") {
     

      // ✅ Extract userId from metadata
      const userId = data.metadata?.userId;
      if (!userId) {
        console.error("No userId found in metadata.");
        return res.redirect("https://betxcircle.com");
      }

      // ✅ Automatically call the verification route on the backend
      const verifyResponse = await axios.post(
        "https://renderelevennew.onrender.com/paystack/verify",
        { reference, userId },
        { headers: { "Content-Type": "application/json" } }
      );

      // console.log("Backend verification response:", verifyResponse.data);

      return res.redirect(`https://betxcircle.com/payment-success?reference=${reference}`);
    } else {
      return res.redirect("https://betxcircle.com/payment-failed");
    }
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return res.redirect("https://betxcircle.com/payment-failed");
  }
});

router.post("/paystack/verify", async (req, res) => {
  const { reference, userId } = req.body;

  try {
    // ✅ 1. Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const transactionDetails = response.data.data;
    if (!transactionDetails || transactionDetails.status !== "success") {
      return res.status(400).json({ message: "Transaction verification failed" });
    }

    const amount = parseFloat(transactionDetails.amount) / 100;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid transaction amount" });
    }

    // ✅ 2. Update user's wallet balance
    const updatedUser = await OdinCircledbModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { "wallet.balance": amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ 3. Save top-up record
    await new TopUpModel({
      userId: updatedUser._id,
      amount,
      transactionId: transactionDetails.id,
      txRef: transactionDetails.reference,
      email: transactionDetails.customer.email,
    }).save();

    // Step 4: Check if this is the user's FIRST top-up
    const topUpCount = await TopUpModel.countDocuments({ userId: updatedUser._id });

    // ✅ 5. Check if referred and qualifies for referral bonus
    if (topUpCount === 1) {
      const referral = await ReferralModel.findOne({ referredUserId: userId, status: "UnPaid" });

      if (referral) {
        const referrer = await OdinCircledbModel.findById(referral.referringUserId);

        if (referrer) {
          const bonusAmount = 500; // Set your referral bonus amount here

          // ✅ Credit the referrer's wallet
          referrer.wallet.cashoutbalance += bonusAmount;
          await referrer.save();

          // ✅ Mark referral as Paid
          referral.status = "Paid";
          await referral.save();

          // ✅ Optional: log this referral reward
          await TopUpModel.create({
            userId: referrer._id,
            amount: bonusAmount,
            type: "referral_bonus",
            transactionId: `REF-${Date.now()}`,
            txRef: `Referral-${userId}`,
            email: referrer.email,
          });

          // --- Send Push Notification ---
          if (referrer.expoPushToken && Expo.isExpoPushToken(referrer.expoPushToken)) {
            await expo.sendPushNotificationsAsync([
              {
                to: referrer.expoPushToken,
                title: "Referral Bonus 🎉",
                body: `💸 Referral bonus unlocked! ₦${bonusAmount} has been added to your wallet.`,
              },
            ]);
          }
        }
      }
    }

    return res.json({
      status: true,
      message: "Transaction verified, wallet updated",
      newBalance: updatedUser.wallet.balance,
    });
  } catch (error) {
    console.error("Error verifying transaction:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});



router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await OdinCircledbModel.findOne({ email: email });

    if (user) {
      // Compare provided password with hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
     // Create JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

      if (isMatch) {
        res.status(200).json({ status: 'success', user: user , token });
      } else {
        res.status(401).json({ status: 'error', message: 'The password is incorrect' });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});


router.post('/verifyEmailAndOTP', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find the unverified user
    const unverifiedUser = await UnverifiedUser.findOne({ email });
    if (!unverifiedUser) {
      return res.status(400).json({ error: 'No registration found. Please register again.' });
    }

    // Validate OTP
    if (unverifiedUser.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check OTP expiry
    if (unverifiedUser.expiresAt < Date.now()) {
      await UnverifiedUser.deleteOne({ email });
      return res.status(400).json({ error: 'OTP expired. Please register again.' });
    }

    // Prevent duplicate user
    const existingUser = await OdinCircledbModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // ✅ Create the verified user
    const newUser = await OdinCircledbModel.create({
      fullName: unverifiedUser.fullName,
      email: unverifiedUser.email,
      password: unverifiedUser.password,
      image: unverifiedUser.image,
      expoPushToken: unverifiedUser.expoPushToken,
      unlockedCount: 10,
      verified: true,
      referralCode: generateReferralCode(),           // generate new code for this user
      codeUsed: unverifiedUser.codeUsed || null       // track code used (if any)
    });

    // ✅ Handle referral if codeUsed exists
    if (unverifiedUser.codeUsed) {
      const referringUser = await OdinCircledbModel.findOne({
        referralCode: unverifiedUser.codeUsed
      });

      if (referringUser) {
        const isAlreadyReferred = referringUser.referrals?.some(
          ref => ref.referredUserId.toString() === newUser._id.toString()
        );

        if (!isAlreadyReferred) {
          // Add to referrer's embedded list
          referringUser.referrals.push({
            referredUserId: newUser._id,
            codeUsed: unverifiedUser.codeUsed,
            email: newUser.email,
            referralDate: new Date(),
          });
          await referringUser.save();

          // Create referral tracking entry
          await ReferralModel.create({
            referredUserId: newUser._id,
            referringUserId: referringUser._id,
            codeUsed: unverifiedUser.codeUsed,
            email: newUser.email,
            status: 'UnPaid',
            referralDate: new Date(),
          });

          console.log(`✅ Referral recorded: ${newUser.email} referred by ${referringUser.email}`);
        }
      } else {
        console.warn(`⚠️ No matching referring user found for code: ${unverifiedUser.codeUsed}`);
      }
    }

    // ✅ Register device
    if (unverifiedUser.expoPushToken) {
      let device = await Device.findOne({ expoPushToken: unverifiedUser.expoPushToken });

      if (!device) {
        device = new Device({
          expoPushToken: unverifiedUser.expoPushToken,
          users: [newUser._id],
        });
      } else if (!device.users.includes(newUser._id)) {
        device.users.push(newUser._id);
      }

      await device.save();
    }

    // ✅ Create wallet
    const wallet = await WalletModel.create({
      userId: newUser._id,
      balance: 0,
      cashoutbalance: 0,
      transactions: [],
    });

    // ✅ Create empty chat self-thread (optional)
    const chat = await ChatModel.create({
      sender: newUser._id,
      receiver: newUser._id,
      author: newUser._id,
      message: '',
      roomId: '',
      messageId: '',
      timestamp: Date.now(),
      recipientId: newUser._id,
      recipientPushToken: '',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Link chat to user
    newUser.chat = [chat._id];
    await newUser.save();

    // ✅ Cleanup unverified record
    await UnverifiedUser.deleteOne({ email });

    res.status(201).json({
      message: 'Account verified and created successfully',
      user: newUser,
      wallet,
      chat
    });

  } catch (err) {
    console.error('❌ Error verifying OTP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ GET all transactions (topup, cashout, winnings) for a user
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch all 3 in parallel
    const [topups, cashouts, wins] = await Promise.all([
      TopUpModel.find({ userId }).sort({ createdAt: -1 }),
      DebitModel.find({ userId }).sort({ createdAt: -1 }),
      WinnerModel.find({ userId }).sort({ createdAt: -1 }),
    ]);

    // normalize structure
    const formatTx = (arr, type) =>
      arr.map((item) => ({
        _id: item._id,
        type,              // "Topup", "Cashout", "Won"
        amount: item.amount,
        date: item.createdAt,
      }));

    const allTx = [
      ...formatTx(topupRes, "Topup"),
      ...formatTx(cashouts, "Cashout"),
      ...formatTx(wins, "Won"),
    ];

    // sort newest first
    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allTx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});


// router.post('/register', upload.single('image'), registrationLimiter, async (req, res) => {
//   try {
//     let { fullName, email, password, expoPushToken,image, referralCode, unlockedCount } = req.body;

//  if (!req.file) return res.status(400).json({ error: 'Profile image is required' });
//       if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

//     email = email.trim().toLowerCase();
//     fullName = fullName.trim().toLowerCase();

//      // Password strength check
//       if (password.length < 6) {
//         return res.status(400).json({ error: 'Password must be at least 6 characters long' });
//       }

//     // Check if already verified
//     const existingVerified = await OdinCircledbModel.findOne({ email });
//     if (existingVerified) {
//       return res.status(400).json({ error: 'User already registered and verified' });
//     }

//     // Remove any existing unverified user with same email
//     const existingUnverified = await UnverifiedUser.findOne({ email });
//     if (existingUnverified) {
//       await UnverifiedUser.deleteOne({ email });
//     }

//     // Check referral
//       let referredBy = null;
//       if (referralCode) {
//         if (referralCode.length > 20) return res.status(400).json({ error: 'Invalid referral code format' });
//         referredBy = await OdinCircledbModel.findOne({ referralCode });
//         if (!referredBy) return res.status(400).json({ error: 'Invalid referral code' });
//       }

//     // Upload image to Cloudinary
//     const result = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { resource_type: 'image' },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       stream.end(req.file.buffer);
//     });

//     if (!result || !result.secure_url) {
//       return res.status(500).json({ message: 'Image upload failed' });
//     }

//     // Generate hashed password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Generate OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();

//       // Create JWT
//     //const token = jwt.sign({ userId: user._id }, JWT_SECRET);

//     console.log(otp,'jdjd')
//     // Save temporary user (Unverified)
//     const unverifiedUser = await UnverifiedUser.create({
//       fullName,
//       email,
//       password: hashedPassword,
//       image: result.secure_url,
//       expoPushToken,
//       //unlockedCount,
//       otp,
//       referralCode: generateReferralCode(),
//       codeUsed: referralCode || null,       // the code they used from someone else
//       createdAt: new Date(),
//       expiresAt: new Date(Date.now() + 15 * 60 * 1000), // expires in 15 mins
//     });

//     // Send OTP email
//     await sendOTPByEmail(unverifiedUser, otp);

//     res.status(201).json({ message: 'OTP sent to email for verification' });

//   } catch (err) {
//     console.error('Registration error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/register', upload.single('image'), registrationLimiter, async (req, res) => {
  try {
    let { fullName, email, password, expoPushToken, referralCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Profile image is required' });
    }
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    email = email.trim().toLowerCase();
    fullName = fullName.trim().toLowerCase();

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // ✅ Password strength check
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    /*** STEP 1: CHECK VERIFIED USERS ***/
    const existingEmailVerified = await OdinCircledbModel.findOne({ email });
    if (existingEmailVerified) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const existingNameVerified = await OdinCircledbModel.findOne({
      fullName: { $regex: `^${fullName}$`, $options: 'i' },
    });
    if (existingNameVerified) {
      return res.status(409).json({ error: 'Full name already exists' });
    }

    /*** STEP 2: CHECK UNVERIFIED USERS ***/
    const existingEmailUnverified = await UnverifiedUser.findOne({ email });
    if (existingEmailUnverified) {
      // Allow re-registration → delete old unverified record
      await UnverifiedUser.deleteOne({ email });
    }

    // Block if same fullName belongs to another unverified user with different email
    // const existingNameUnverified = await UnverifiedUser.findOne({
    //   fullName: { $regex: `^${fullName}$`, $options: 'i' },
    //   email: { $ne: email }
    // });
    // if (existingNameUnverified) {
    //   return res.status(409).json({ error: 'Full name already exists (unverified)' });
    // }

    /*** STEP 3: REFERRAL CHECK ***/
    let referredBy = null;
    if (referralCode) {
      if (referralCode.length > 20) {
        return res.status(400).json({ error: 'Invalid referral code format' });
      }
      referredBy = await OdinCircledbModel.findOne({ referralCode });
      if (!referredBy) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    /*** STEP 4: UPLOAD IMAGE ***/
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    if (!result || !result.secure_url) {
      return res.status(500).json({ message: 'Image upload failed' });
    }

    /*** STEP 5: HASH PASSWORD & CREATE OTP ***/
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    /*** STEP 6: CREATE UNVERIFIED USER ***/
    const unverifiedUser = await UnverifiedUser.create({
      fullName,
      email,
      password: hashedPassword,
      image: result.secure_url,
      expoPushToken,
      otp,
      referralCode: generateReferralCode(),
      codeUsed: referralCode || null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // expires in 15 mins
    });

    /*** STEP 7: SEND OTP ***/
    await sendOTPByEmail(unverifiedUser, otp);

    res.status(201).json({ message: 'OTP sent to email for verification' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/registers',upload.single('image'), registrationLimiter, async (req, res) => {
  try {
    const { password, expoPushToken,phone, image, referralCode } = req.body;

    // Check if req.file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

     // Check if referral code exists
     let referredBy = null;
     if (referralCode) {
       referredBy = await OdinCircledbModel.findOne({ referralCode: referralCode });
       if (!referredBy) {
         return res.status(400).json({ error: 'Invalid referral code' });
       }
     }

    // Upload image to Cloudinary using upload_stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            reject({ message: 'Image upload failed', error });
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file.buffer);
    });

      if (!result || !result.secure_url) {
        return res.status(500).json({ message: 'Failed to get secure_url from Cloudinary result' });
      }
  
  // Check if referral code exists

     // Generate a salt and hash the password
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(req.body.password, salt); 

    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Example: Express + MongoDB
const email = req.body.email?.trim().toLowerCase();
const fullName = req.body.fullName?.trim().toLowerCase();
    
    // Create a new user
    const newUser = await OdinCircledbModel.create({
      fullName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email,
      //password: req.body.password,
      password: hashedPassword, // Use hashed password
      // Other user properties...
      otp: otp.toString(),
      //otpTrans: otp.toString(),
      //image: result.secure_url, // Store the Cloudinary URL
      image: result.secure_url,  
      expoPushToken,
      referralCode: generateReferralCode(),
      //codeUsed: unverifiedUser.codeUsed || null,
    });


    // If the user was referred, add the referral data
if (referredBy) {
  const isAlreadyReferred = referredBy.referrals.some(referral => referral.referredUserId.toString() === newUser._id.toString());

  if (isAlreadyReferred) {
    return res.status(400).json({ error: 'This user has already been referred by this code' });
  }

  
     // If the user was referred, add the referral data
     if (referredBy) {
      // Update the referring user's referral list
      referredBy.referrals.push({
        referredUserId: newUser._id,
        codeUsed: referralCode,
        email: newUser.email,
      });
      await referredBy.save();

      // Create a separate document in the Referral schema
      await ReferralModel.create({
        referredUserId: newUser._id,
        referringUserId: referredBy._id,
        codeUsed: referralCode,
        email: newUser.email,
        status: "UnPaid", // Default status for new referrals
      });
    }
}
      // Save the new user
      await newUser.save();
   // Check if the expoPushToken already exists in the Device collection
   let device = await Device.findOne({ expoPushToken });

   if (!device) {
     // If no device exists with this expoPushToken, create a new one
     device = new Device({
       expoPushToken,
       users: [newUser._id], // Add the new user ID to the device's users array
     });
   } else {
     // If the device already exists, check if the user is already registered
     if (!device.users.includes(newUser._id)) {
       device.users.push(newUser._id); // Add the new user to the device's users array
     }
   }

   // Save the updated or new device
   await device.save();

  
     // Save the OTP details in the database
     await UserOtpVerification.create({
      userId: newUser._id,
      otp: otp.toString(), // Convert OTP to string for storage
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
    });
   // console.log('OTP verification record created:', otpVerification);

 // Send OTP to user's email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'odincirclex@gmail.com',
        pass: 'xyqi telz pmxd evkl',
      },
    });

 
    const mailOptions = {
      from: 'odincirclex@gmail.com',
      to: newUser.email,
      subject: 'Confirm your Identity',
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #fff; padding: 20px;">
        <img src="cid:logo" alt="Logo" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px;" />
        <p style="color: #000; margin-bottom: 10px; font-size: 16px">Hello ${newUser.fullName},</p>
        <h2 style="color: #000; margin-bottom: 10px; font-size: 24px">Confirm Your Identity</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up to Odincircle. Here's your One Time Password to verify your account.</p>
        <h3 style="font-size: 24px; color: #000; margin-bottom: 10px; background-color: aliceblue; padding: 20px 0; text-align: center";>${otp}</h3>
        <p style="font-size: 16px; margin-bottom: 20px;">If you have any complaint please contact our support team immediately via in-app or email.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">support@odincirclegames.co</p>
        <p style="font-size: 16px;">Please use this OTP to complete your registration process.</p>
      </div>`, // HTML content with inline CSS styles
    attachments: [
      {

      },
    ],
  };
  
    //transporter.sendMail(mailOptions);

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  console.log('OTP sent to user:', newUser.email);
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});

      // Create a new wallet for the user
      const newWallet = await WalletModel.create({
          userId: newUser._id,
          balance: 0,
          cashoutbalance: 0,
          transactions: []
      });
      
      // Create an initial chat document for the user
      const initialChat = await ChatModel.create({
          sender: newUser._id, // Sender is the newly registered user
          receiver: newUser._id, // Initially set receiver to null, can be updated later
          author: newUser._id,
          message: "", // Initial welcome message
          roomId: "", // Initial welcome message
          messageId: "",
          timestamp: Date.now(),
          recipientId: newUser._id,
          recipientPushToken: "",
          // delivered: false,
          // seen: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 15 minutes
      });

      // Save the chat ID in the user's document
      newUser.chat = [initialChat._id];

      // Save the updated user (with wallet and chat reference)
      await newUser.save();

    
      res.status(201).json({ user: newUser, wallet: newWallet, chat: initialChat,  });
  } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
  }
});

// Function to send OTP to user's email
async function sendOTPByEmail(unverifiedUser, otp) {
  try {
      // Create a nodemailer transporter
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'odincirclex@gmail.com',
          pass: 'xyqi telz pmxd evkl',
        },
      });

      const mailOptions = {
        from: 'odincirclex@gmail.com',
        to: unverifiedUser.email,
        subject: 'Confirm your Identity',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #fff; padding: 20px;">
           <!-- Header -->
      <div style="text-align: center; padding: 10px 0; border-bottom: 2px solid #000;">
        <h2 style="color: #000; margin: 0;">betxcircle</h2>
        <p style="color: #666; font-size: 14px; margin: 0;">Confirm Identity</p>
      </div>
          <p style="color: #000; margin-bottom: 10px; font-size: 16px">Hello ${unverifiedUser.fullName},</p>
          <h2 style="color: #000; margin-bottom: 10px; font-size: 24px">Confirm Your Identity</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up to betxcircle. Here's your One Time Password to verify your account.</p>
          <h3 style="font-size: 24px; color: #000; margin-bottom: 10px; background-color: aliceblue; padding: 20px 0; text-align: center";>${otp}</h3>
          <p style="font-size: 16px; margin-bottom: 20px;">If you have any complaint please contact our support team immediately via in-app or email.</p>
          <p style="font-size: 16px; margin-bottom: 20px;">odincirclex@gmail.com</p>
          <p style="font-size: 16px;">Please use this OTP to complete your registration process.</p>
        </div>`, // HTML content with inline CSS styles
  
    };

      // Send the email
      await transporter.sendMail(mailOptions);

      console.log('OTP email sent successfully.');
  } catch (error) {
      console.error('Error sending OTP email:', error.message);
      throw new Error('Failed to send OTP email.');
  }
}

// GET /referral/summary/:userId
router.get('/referral/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await OdinCircledbModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const referrals = await ReferralModel.find({ referringUserId: userId });

    const totalReferrals = referrals.length;
    const activated = referrals.filter(r => r.status === "Paid");
    const payout = activated.length * 500; // reward per referral

    res.json({
      referralCode: user.referralCode,
      totalReferrals,
      activatedCount: activated.length,
      payout,
    });
  } catch (error) {
    console.error('Referral summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch referral summary' });
  }
});

// GET /referrals/summary/all

// GET /referrals/summary/all
router.get('/referrals/summary/all', async (req, res) => {
  try {
    const summary = await ReferralModel.aggregate([
      {
        $group: {
          _id: '$referringUserId', // group by referring user
          totalReferrals: { $sum: 1 },
          activatedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'odincircledbnames', // your collection name
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          fullName: '$user.fullName',
          email: '$user.email',
          referralCode: '$user.referralCode',
          totalReferrals: 1,
          activatedCount: 1,
          payout: { $multiply: ['$activatedCount', 500] } // reward per referral
        }
      },
      { $sort: { totalReferrals: -1 } }, // top referrers first
    ]);

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error fetching global referral summary:', error);
    res.status(500).json({ error: 'Failed to fetch global referral summary' });
  }
});


router.post('/check-user', async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: 'Email and full name are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim().toLowerCase();

    // Check email
    const existingEmail = await OdinCircledbModel.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Check full name (case-insensitive)
    const existingName = await OdinCircledbModel.findOne({
      fullName: { $regex: `^${normalizedFullName}$`, $options: 'i' },
    });

    if (existingName) {
      return res.status(409).json({ error: 'Full name already exists' });
    }

    // All good
    return res.status(200).json({ available: true });
  } catch (error) {
    console.error('Error checking user:', error.message || error);
    return res.status(500).json({
      message: 'Something went wrong. Please try again later.',
    });
  }
});



router.get('/referral/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Step 1: Find the user by ID
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const referralCode = user.referralCode;

    // Step 2: Find referrals matching the user's referral code
    const referrals = await ReferralModel.find({ codeUsed: referralCode });

    res.status(200).json({
      referralCode,
      referrals,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ message: 'Error fetching referrals' });
  }
});

router.get('/getBankDetails/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      const bankDetails = await BankModel.findOne({ userId });
      if (!bankDetails) {
          return res.status(200).json({ message: 'No bank details found', data: null });
      }
      res.status(200).json(bankDetails);
  } catch (error) {
      console.error('Error fetching bank details:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/usersByIds
router.post('/api/usersByIds', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const users = await OdinCircledbModel.find({ _id: { $in: ids } })
      .select('_id fullName image');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users by IDs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/message-status/:roomId/:userId
router.get('/api/message-status/:roomId/:userId', async (req, res) => {
  const { roomId, userId } = req.params;

  try {
    const messages = await ChatMessage.find({
      roomId,
      senderId: userId, // messages sent by ME
      status: { $in: ['sent', 'delivered'] },
    }).select('_id status');

    const statusMap = {};
    messages.forEach(msg => {
      statusMap[msg._id] = msg.status;
    });

    res.json(statusMap); // e.g., { "msg1": "read", "msg2": "delivered" }
  } catch (err) {
    console.error('❌ Error checking message statuses:', err);
    res.status(500).json({ error: 'Server error checking statuses' });
  }
});

router.get('/api/unreadCount/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const unreadMessages = await ChatMessage.find({
      receiverId: userId,
      status: 'sent'
    }).sort({ timestamp: -1 }); // latest unread first

    const unreadMap = {};

    unreadMessages.forEach(msg => {
      const senderId = msg.senderId.toString();

      if (!unreadMap[senderId]) {
        unreadMap[senderId] = {
          count: 1,
          timestamp: msg.timestamp // take latest timestamp
        };
      } else {
        unreadMap[senderId].count += 1;
      }
    });

    res.json(unreadMap);
  } catch (err) {
    console.error('❌ Error fetching unread messages:', err);
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
});


router.get('/api/usersVisibleTo/:userId', async (req, res) => {
  const { page = 1, limit = 10, firstLetter, query } = req.query;

  try {
    // confirm requester exists
    const requestingUser = await OdinCircledbModel.findById(req.params.userId).select('_id');
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    // Base filter: exclude requesting user
    const filter = { _id: { $ne: req.params.userId } };

    // Alphabet search
    if (firstLetter) {
      filter.fullName = { $regex: `^${firstLetter}`, $options: 'i' };
    }

    // Typed search (overrides or combines with firstLetter)
    if (query) {
      filter.fullName = { $regex: query, $options: 'i' };
    }

    const users = await OdinCircledbModel.find(filter)
      .select('fullName email image')
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .sort({ fullName: 1 });

    const totalCount = await OdinCircledbModel.countDocuments(filter);
    const hasMore = pageInt * limitInt < totalCount;

    res.json({ items: users, hasMore });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/apis/usersVisibleTo/:userId', async (req, res) => {
  const { page = 1, limit = 10, firstLetter } = req.query;

  try {
    // Just to confirm the requester exists
    const requestingUser = await OdinCircledbModel.findById(req.params.userId).select('_id');
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    // Base filter: exclude requesting user
    const filter = { _id: { $ne: req.params.userId } };

    // Optional alphabet filter
    if (firstLetter) {
      filter.fullName = { $regex: `^${firstLetter}`, $options: 'i' };
    }

    // Query users
    const users = await OdinCircledbModel.find(filter)
      .select('fullName email image')
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .sort({ fullName: 1 });  // alphabetical

    // Count total for pagination
    const totalCount = await OdinCircledbModel.countDocuments(filter);
    const hasMore = pageInt * limitInt < totalCount;

    res.json({ items: users, hasMore });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get how many items a user has unlocked
// Fetch limited users based on requesting user's unlockedCount
router.get('/apis/usersVisibleTo/:userId', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const requestingUser = await OdinCircledbModel.findById(req.params.userId).select('unlockedCount');
    
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    const unlockedCount = requestingUser.unlockedCount ?? 10;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    // Ensure you don't fetch beyond unlockedCount
    const effectiveLimit = Math.min(limitInt, unlockedCount - (pageInt - 1) * limitInt);

    const users = await OdinCircledbModel.find({ _id: { $ne: req.params.userId } })
      .select('fullName email image')
      .skip((pageInt - 1) * limitInt)
      .limit(effectiveLimit);

    const hasMore = pageInt * limitInt < unlockedCount;

    res.json({ items: users, hasMore });
  } catch (err) {
    console.error('Error fetching visible users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/unlockMore
router.post('/api/unlockMore', async (req, res) => {
  const { userId, amount, costPerUnlock } = req.body;

  try {
    const user = await OdinCircledbModel.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Count all users (including self)
    const totalUsers = await OdinCircledbModel.countDocuments();
    const maxUnlockable = totalUsers - 1; // exclude self

    if (user.unlockedCount >= maxUnlockable) {
      return res.status(400).json({ error: 'All users already unlocked' });
    }

    const totalCost = costPerUnlock;

    if (user.wallet.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Only increase unlockedCount up to the max
    const newUnlockedCount = Math.min(user.unlockedCount + amount, maxUnlockable);

    user.wallet.balance -= totalCost;
    user.unlockedCount = newUnlockedCount;

    await user.save();

    res.json({
      message: 'Unlock successful',
      unlockedCount: user.unlockedCount,
      wallet: user.wallet.balance,
    });
  } catch (err) {
    console.error('UnlockMore error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// routes/userRoutes.js or wherever your routes are
router.get('/api/users/count', async (req, res) => {
  try {
    const total = await OdinCircledbModel.countDocuments();
    res.json({ total }); // return { total: number }
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Failed to count users' });
  }
});

// Update bank details
// Update bank details
router.put('/updateBankDetails/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bankName, accountName, accountNumber } = req.body;

    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if account number is already taken by another user
    const existingAccount = await BankModel.findOne({ accountNumber, userId: { $ne: userId } });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account number already in use by another user' });
    }

    // Update or create bank record for this user
    const updatedBank = await BankModel.findOneAndUpdate(
      { userId },
      { bankName, accountName, accountNumber },
      { upsert: true, new: true, runValidators: true }
    );

    // Update in user model if you store it there too
    await OdinCircledbModel.findByIdAndUpdate(
      userId,
      { bankDetails: { bankName, accountName, accountNumber } },
      { new: true }
    );

    res.status(200).json({ message: 'Bank details updated successfully', bank: updatedBank });
  } catch (error) {
    console.error("Error updating bank details: ", error);
    res.status(500).json({ message: 'Failed to update bank details', error: error.message });
  }
});





// router.post("/verifyEmailAndOTP",verifyToken, async (req, res) => {
//   try {
//     const { email, otp } = req.body;
    
//     // Check if email and OTP are provided and not empty
//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }

//     if (!otp) {
//       return res.status(400).json({ error: "OTP is required" });
//     }

//     // Find the user by email
//     let user = await OdinCircledbModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     let userOtpRecord = await UserOtpVerification.findOne({ userId: user._id });

//     if (!userOtpRecord || userOtpRecord.otp !== otp) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     user.verified = true;
//     await user.save();

//     res.json({ message: "User verified successfully" });
//   } catch (error) {
//     // Handle any errors that occur during the verification process
//     console.error('Error verifying email and OTP:', error.message);
//     res.status(400).json({ error: "Failed to verify email and OTP" });
//   }
// });

router.post('/verifyEmailAndOTP', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const unverifiedUser = await UnverifiedUser.findOne({ email });
    if (!unverifiedUser) {
      return res.status(400).json({ error: 'No registration found. Please register again.' });
    }

    if (unverifiedUser.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (unverifiedUser.expiresAt < Date.now()) {
      await UnverifiedUser.deleteOne({ email });
      return res.status(400).json({ error: 'OTP expired. Please register again.' });
    }

    // Prevent duplicate verified users
    const existingUser = await OdinCircledbModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // ✅ CREATE THE VERIFIED USER, INCLUDE CODE USED
    const newUser = await OdinCircledbModel.create({
      fullName: unverifiedUser.fullName,
      email: unverifiedUser.email,
      password: unverifiedUser.password,
      image: unverifiedUser.image,
      expoPushToken: unverifiedUser.expoPushToken,
      verified: true,
      referralCode: unverifiedUser.referralCode,   // their own new code
      codeUsed: unverifiedUser.codeUsed || null,   // the code they used to sign up
    });

    // ✅ CREATE REFERRAL ENTRY IF codeUsed EXISTS
    if (unverifiedUser.codeUsed) {
      const referrer = await OdinCircledbModel.findOne({ referralCode: unverifiedUser.codeUsed });

      if (referrer) {
        // Add to referrer's embedded referrals array
        referrer.referrals.push({
          referredUserId: newUser._id,
          codeUsed: unverifiedUser.codeUsed,
          email: newUser.email,
          referralDate: new Date(),
        });
        await referrer.save();

        // Create standalone referral entry
        await ReferralModel.create({
          referredUserId: newUser._id,
          referringUserId: referrer._id,
          codeUsed: unverifiedUser.codeUsed,
          email: newUser.email,
          status: 'UnPaid',
          referralDate: new Date(),
        });
      }
    }

    // ✅ CLEAN UP
    await UnverifiedUser.deleteOne({ email });

    res.status(201).json({ message: 'User verified and created successfully' });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'odincirclex@gmail.com',
    pass: 'xyqi telz pmxd evkl',
  },
});

// Utility functions
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (email) => jwt.sign({ email }, jwtSecret, { expiresIn: '1h' });

router.post('/register-device', async (req, res) => {
  const { expoPushToken, userId } = req.body;

  // Check if expoPushToken and userId are not null
  if (!expoPushToken || !userId) {
    return res.status(400).json({ success: false, message: 'expoPushToken and userId are required' });
  }

  try {
    let device = await Device.findOne({ expoPushToken });

    if (!device) {
      // If no document found, log that a new device is being created
      console.log('No existing device found, creating a new one.');
      device = new Device({
        expoPushToken,
        users: [{ _id: userId }], // Initialize with the first user
      });
    } else {
      // Ensure device.users is not null or undefined
      if (device.users && !device.users.some(user => user._id?.toString() === userId.toString())) {
        device.users.push({ _id: userId }); // Add new userId if not already present
      }
    }

    await device.save();
    res.status(200).json({ success: true, message: 'User and token saved successfully' });
  } catch (error) {
    console.error('Error saving expoPushToken:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

const saveDevice = async (expoPushToken, userId) => {
  try {
    let device = await Device.findOne({ expoPushToken });

    if (!device) {
      console.log('No existing device found, creating a new one.');
      device = new Device({
        expoPushToken,
        users: [{ _id: userId }],
      });
    } else {
      if (device.users && !device.users.some(user => user._id.toString() === userId.toString())) {
        device.users.push({ _id: userId });
      }
    }

    await device.save();
    return true;
  } catch (error) {
    console.error('Error saving expoPushToken:', error);
    return false;
  }
};

// Route to update device registration with user ID
router.post('/update-device',verifyToken, async (req, res) => {
  const { userId, expoPushToken } = req.body;

  if (!userId || !expoPushToken) {
    return res.status(400).json({ success: false, message: 'User ID and expoPushToken are required' });
  }

  try {
    // Find the device document with the given expoPushToken
    const device = await Device.findOne({ expoPushToken });

    if (device) {
      // Update the device document with the new userId
      if (!device.users.includes(userId)) {
        device.users.push(userId);
        await device.save();
      }
      res.status(200).json({ success: true, message: 'Device updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Device not found' });
    }
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await OdinCircledbModel.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit code

    // Save OTP to the database
    await UserOtpVerification.findOneAndUpdate(
      { userId: user._id }, 
      { otp },               
      { upsert: true, new: true }
    );

    // Send OTP via email
    await transporter.sendMail({
      from: 'odincirclex@gmail.com',
      to: email,
      subject: 'Password Reset Code',
      // text: `Your password reset code is ${otp}`,
      html: `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 20px auto; border: 1px solid #ddd;">
      <!-- Header -->
      <div style="text-align: center; padding: 10px 0; border-bottom: 2px solid #000;">
        <h2 style="color: #000; margin: 0;">betxcircle</h2>
        <p style="color: #666; font-size: 14px; margin: 0;">Reset Code</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 20px;">
    
        <!-- OTP Code -->
        <p style="font-size: 16px; font-weight: bold; color:rgb(9, 9, 9); margin-top: 20px;">
          Your password reset code is: <span style="color:rgb(1, 7, 14);">${otp}</span>
        </p>
        <p style="color: #333; font-size: 14px;">
          If you have any questions or concerns, feel free to reach out to us.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
        <p style="margin: 5px 0;">Thank you,</p>
        <p style="margin: 5px 0;">betxcircle Admin</p>
        <p style="margin: 5px 0;">Contact: odincirclex@gmail.com</p>
      </div>
    </div>
    `
    });

    res.send('Reset code sent');
  } catch (error) {
    console.error('Error sending reset code:', error.message);
    res.status(500).send('Error sending reset code');
  }
});



router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await OdinCircledbModel.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const otpRecord = await UserOtpVerification.findOne({
      userId: user._id, 
      otp: code         
    });

  
    if (!otpRecord) {
      return res.status(400).send('Invalid or expired code');
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).send('Error verifying OTP');
  }
});


router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Find the user by email
    const user = await OdinCircledbModel.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.password = hashedPassword;
    await user.save();
    
    // Send a success response
    res.send('Password reset successful');
  } catch (error) {
    console.error(`Error resetting password: ${error.message}`);
    res.status(500).send('Error resetting password');
  }
});




// Mark message as read
router.put('/messages/read-all',verifyToken, async (req, res) => {
  const { author } = req.body;
  try {
    // Update all messages from the specified author to mark them as read
    const result = await ChatsFriends.updateMany({ author }, { $set: { unreadCount: 0, isRead: true } });

    res.status(200).json({ message: 'All messages marked as read', result });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/api/unread-messages/:recipientId',verifyToken, async (req, res) => {
  const { recipientId } = req.params;

  try {
    const unreadMessages = await ChatsFriends.find({ recipientId });

    if (unreadMessages.length === 0) {
      console.log('No unread messages found for recipientId:', recipientId);
    }

    res.json(unreadMessages);
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ message: 'Error fetching unread messages' });
  }
});


// Fetch messages by roomId
router.get('/messages/retrieve/:roomId',verifyToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await ChatModel.find({ roomId }).sort({ timestamp: -1 }); // Latest messages first
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
});


router.get('/usersWithLastMessages',verifyToken, async (req, res) => {
  try {

    const users = await OdinCircledbModel.find({});

    const usersWithLastMessages = await Promise.all(
      users.map(async (user) => {
      
        const lastMessage = await ChatModel.findOne({
          $or: [{ author: user._id }],
        })
          .sort({ timestamp: -1 })
          .exec();

        const userWithLastMessage = { ...user.toObject(), lastMessage };
        return userWithLastMessage;
      })
    );

    //console.log("Finished mapping users to their last messages");
    res.status(200).send(usersWithLastMessages);
  } catch (error) {
    console.error("Error fetching users with last messages:", error);
    res.status(500).send({ error: error.message });
  }
});


router.get('/cart-items', async (req, res) => {
  const cartItems = await CartItem.find();
  res.json(cartItems);
});

router.post('/cart-items', async (req, res) => {
  const newItem = new CartItem(req.body);
  await newItem.save();
  res.status(201).json(newItem);
});

router.post('/check-email',verifyToken, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await OdinCircledbModel.findOne({ email: email });
    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email existence:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new delete request
router.post('/delete-account', async (req, res) => {
  const {userId, fullName, email,  confirmationText } = req.body;

  // Validate input fields
  if (!userId  || !email || !fullName || !confirmationText) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
  }

  try {
      // Create a new delete request
      const newDeleteRequest = new DeleteRequestModel({
          userId,
          fullName,
          email,
          confirmationText,
      });

      // Save to database
      await newDeleteRequest.save();

      res.status(201).json({ message: 'Delete request created successfully.' });
  } catch (error) {
      console.error('Error creating delete request:', error);
      res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

router.post('/resendOTP', async (req, res) => {
  try {
      const { email } = req.body;

      // Generate a new OTP (you can use any OTP generation logic here)
      const newOTP = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit OTP

       // To get the user's information, let's assume there's a function to fetch the user by email
       const user = await UnverifiedUser.findOne({ email: email });
       if (!user) {
         throw new Error('User not found.');
       }
 
      // Log the generated OTP
      console.log(`Generated OTP for  ${email}: ${newOTP}`);

      // Update or create a new OTP record for the user by email
      await UserOtpVerification.findOneAndUpdate(
          { userId: user._id},
          { otp: newOTP },
          { upsert: true }
      );

      // Update or create a new OTP record for the user by email
      await UnverifiedUser.findOneAndUpdate(
        { email: email },
        { otp: newOTP },
        { upsert: true }
    );

      // Send the OTP to the user's email
     
      // Call the sendOTPByEmail function with the user object and OTP
      await ResendOTPByEmail(user, newOTP);

      // Respond with success message
      res.status(200).json({ message: 'OTP has been resent to your email.' });
  } catch (error) {
      console.error('Error resending OTP:', error.message);
      res.status(500).json({ error: 'Failed to resend OTP. Please try again later.' });
  }
});


async function ResendOTPByEmail(user, newOTP) {
  try {
      // Create a nodemailer transporter
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'odincirclex@gmail.com',
          pass: 'xyqi telz pmxd evkl',
        },
      });

      const mailOptions = {
        from: 'odincirclex@gmail.com',
        to: user.email,
        subject: 'Confirm your Identity',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #fff; padding: 20px;">
           <!-- Header -->
      <div style="text-align: center; padding: 10px 0; border-bottom: 2px solid #000;">
        <h2 style="color: #000; margin: 0;">betxcircle</h2>
        <p style="color: #666; font-size: 14px; margin: 0;">Confirm Identity</p>
      </div>
          <p style="color: #000; margin-bottom: 10px; font-size: 16px">Hello ${user.fullName},</p>
          <h2 style="color: #000; margin-bottom: 10px; font-size: 24px">Confirm Your Identity</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up to betxcircle. Here's your One Time Password to verify your account.</p>
          <h3 style="font-size: 24px; color: #000; margin-bottom: 10px; background-color: aliceblue; padding: 20px 0; text-align: center";>${newOTP}</h3>
          <p style="font-size: 16px; margin-bottom: 20px;">If you have any complaint please contact our support team immediately via in-app or email.</p>
          <p style="font-size: 16px; margin-bottom: 20px;">odincirclex@gmail.com</p>
          <p style="font-size: 16px;">Please use this OTP to complete your registration process.</p>
        </div>`, // HTML content with inline CSS styles
  
    };

      // Send the email
      await transporter.sendMail(mailOptions);

      console.log('Resend OTP email sent successfully.');
  } catch (error) {
      console.error('Error sending OTP email:', error.message);
      throw new Error('Failed to send OTP email.');
  }
}

// Update user's profile image
router.put('/updateUserProfileImage/:userId', upload.single('image'),verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload the image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            reject({ message: 'Image upload failed', error });
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    // Update the user's image URL in the database
    user.image = result.secure_url; // Save the secure URL to the database
    await user.save();

    res.status(200).json({ message: 'Profile image updated successfully', imageUrl: user.image });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile by userId
router.get('/getUserProfile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await OdinCircledbModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      phone: user.phone,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /updateUserProfile/:userId
router.put('/updateUserProfile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fullName, image } = req.body;

    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName.trim().toLowerCase();
    if (image) user.image = image; // should be a URL or Base64 depending on your client logic

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



router.post('/add-bank-details',verifyToken, async (req, res) => {
  const { bankName, accountName, accountNumber, userId } = req.body;

  try {
    // Check if a bank detail entry with the given account name already exists
    let existingBankDetail = await BankModel.findOne({ accountName });

    if (existingBankDetail) {

      existingBankDetail.accountNumber = accountNumber;
      await existingBankDetail.save();

      res.status(200).json({ message: 'Account number updated successfully' });
    } else {
      const newBankDetail = new BankModel({
        userId,
        bankName,
        accountName,
        accountNumber,
      });

      await newBankDetail.save();

      res.status(200).json({ message: 'Bank details added successfully' });
    }
  } catch (error) {
    console.error('Error adding or updating bank details:', error);
    res.status(500).json({ message: 'An error occurred while adding or updating bank details' });
  }
});

router.post('/verify-password', async (req, res) => {
  const { userId, password, amount } = req.body;

  try {
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    if (user.cashoutbalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // ✅ Password and balance OK — generate OTP
    const otp = generateOTP();

    // Save OTP to DB for later verification
    await TransOtpVerify.create({ userId, otp });

    // Send OTP to user's email
    await sendOTPEmail(user.email, otp);

    return res.status(200).json({ message: 'Password verified. OTP sent to email.' });

  } catch (error) {
    console.error('Error in /verify-password:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//Transotp
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'odincirclex@gmail.com',
      pass: 'xyqi telz pmxd evkl',
    },
  });

     
  const mailOptions = {
    from: 'odincirclex@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    html: `<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 20px auto; border: 1px solid #ddd;">
  <!-- Header -->
  <div style="text-align: center; padding: 10px 0; border-bottom: 2px solid #000;">
    <h2 style="color: #000; margin: 0;">betxcircle</h2>
    <p style="color: #666; font-size: 14px; margin: 0;">One Time Password</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 20px;">

    <!-- OTP Code -->
    <p style="font-size: 16px; font-weight: bold; color:rgb(9, 9, 9); margin-top: 20px;">
      Your OTP code is: <span style="color:rgb(1, 7, 14);">${otp}</span>
    </p>
    <p style="color: #333; font-size: 14px;">
      If you have any questions or concerns, feel free to reach out to us.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
    <p style="margin: 5px 0;">Thank you,</p>
    <p style="margin: 5px 0;">betxcircle Admin</p>
    <p style="margin: 5px 0;">Contact: odincirclex@gmail.com</p>
  </div>
</div>
`
  };

  return transporter.sendMail(mailOptions);
};

// Send OTP transaction route
router.post('/send-otptransaction',verifyToken, async (req, res) => {
  const { userId, amount  } = req.body;

  try {
    // Fetch the user's email based on the user ID
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const email = user.email;
    const otp = generateOTP();

    // Save the OTP details in the database
    const otpTrans = new TransOtpVerify({
      userId,
      otp: otp.toString(), // Convert OTP to string for storage
      createdAt: new Date()
    });
    await otpTrans.save();

    // Send OTP to email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'An error occurred while sending OTP' });
  }
});





module.exports = router;


// Define the route
router.post('/addOrUpdateBankDetails', async (req, res) => {
  const { userId, bankName, accountName, accountNumber } = req.body;

  try {
      // Use findOneAndUpdate with upsert option
      const bankDetails = await BankModel.findOneAndUpdate(
          { userId }, 
          { bankName, accountName, accountNumber }, 
          { new: true, upsert: true }
      );

      res.status(200).json({
          message: 'Bank details saved successfully',
          data: bankDetails
      });
  } catch (error) {
      console.error('Error saving bank details:', error);
      res.status(500).json({
          message: 'Error saving bank details',
          error: error.message
      });
  }
});


router.post('/check-user-existence',verifyToken, async (req, res) => {
  const { email, phone, bvn, fullName } = req.body;

  try {
    // Check if email already exists
    const emailExists = await OdinCircledbModel.findOne({ email });

    const fullNameExists = await OdinCircledbModel.findOne({ fullName });
    // Check if phone already exists
    const phoneExists = await OdinCircledbModel.findOne({ phone });
    // Check if BVN already exists
    const bvnExists = await OdinCircledbModel.findOne({ bvn });

    res.json({
      emailExists: !!emailExists,
      fullNameExists: !!fullNameExists,
      phoneExists: !!phoneExists,
      bvnExists: !!bvnExists,
    });
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ message: 'An error occurred while checking user existence' });
  }
});



router.get('/check-fullname',verifyToken, async (req, res) => {
  try {
   const fullName = req.query.fullName?.trim().toLowerCase();

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    const user = await OdinCircledbModel.findOne({ fullName });

    return res.json({ exists: !!user });
  } catch (error) {
    console.error('Error checking full name:', error.message || error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});


router.get("/check-username", async (req, res) => {
   const fullName = req.query.fullName?.trim().toLowerCase();

  try {
    // Check if username exists in the database
    const userExists = await OdinCircledbModel.findOne({ fullName });

    if (userExists) {
      return res.json({
        available: false,
      });
    } else {
      return res.json({ available: true });
    }
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// Check balance route
router.post('/check-balance',verifyToken, async (req, res) => {
  const { userId, amount } = req.body;

  try {
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const withdrawalAmount = parseFloat(amount);
    if (user.wallet.balance < withdrawalAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    res.status(200).json({ message: 'Sufficient balance' });
  } catch (error) {
    console.error('Error checking balance:', error);
    res.status(500).json({ message: 'An error occurred while checking balance' });
  }
});

router.post('/save-topup', async (req, res) => {
  const { userId, topUpAmount } = req.body;

  try {
      const newTopUp = new TopUpModel({
          userId: userId,
          topUpAmount: topUpAmount,
      });

      await newTopUp.save();
      res.status(200).json({ message: 'Top-up saved successfully!' });
  } catch (error) {
      console.error('Error saving top-up:', error);
      res.status(500).json({ error: 'Failed to save top-up' });
  }
});

// Update user balance route

//balance
router.get("/user/:id",verifyToken, async (req, res) => {
    const userId = req.params.id;
  
    try {
      const user = await OdinCircledbModel.findById(userId).populate('wallet');
  
      // Check if user exists
      if (user) {
        // Extract the balance from the user's wallet
        const balance = user.wallet.balance;

        res.json({ user, balance });
      } else {
       
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      // Log and handle any errors that occur
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

   //cashoutbalance
  router.get("/user/:id",verifyToken, async (req, res) => {
    const userId = req.params.id;
  
    try {
      // Find the user by userId
      const user = await OdinCircledbModel.findById(userId);
  
      // Check if user exists
      if (user) {
        await user.populate('wallet').execPopulate();
  
        const cashoutbalance = user.wallet.cashoutbalance;
  
        res.json({ user, cashoutbalance });
      } else {

        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
    
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Endpoint to get user's wallet balance by ID
router.get('/user/:userId/balance', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user by ID
      const user = await OdinCircledbModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Respond with user's wallet balance
      res.json({ balance: user.wallet.balance });
    } catch (error) {
      console.error('Error fetching user balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

    // Endpoint to get user's wallet cashoutbalance by ID
router.get('/user/:userId/cashoutbalance', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by ID
    const user = await OdinCircledbModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with user's wallet balance
    res.json({ cashoutbalance: user.wallet.cashoutbalance });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  router.post('/add-update-balance',verifyToken, async (req, res) => {
    const { userId, amount } = req.body;
  
    try {
      // Find the user by userId
      const user = await OdinCircledbModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.wallet.balance += parseInt(amount); 
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: 'Amount added successfully' });
    } catch (error) {
      // Log any errors that occur
      console.error('Error adding amount to wallet:', error);
      res.status(500).json({ message: 'Error adding amount to wallet' });
    }
  });



  router.post('/user-amount',verifyToken, async (req, res) => {
    const { userId, amount } = req.body;
  
    try {
      // Find the user by userId
      const user = await OdinCircledbModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  

       user.wallet.transactions.push({ amount: parseInt(amount) }); 
  
  
    await user.save();

    res.status(200).json({ message: 'Amount added to transactions successfully' });
  } catch (error) {
    // Log any errors that occur
    console.error('Error adding the amount to transactions:', error);
    res.status(500).json({ message: 'Error updating amount in transactions' });
  }
});


// Route to get the amount for a specific user
router.get('/user/:userId/amount',verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by userId
    const user = await OdinCircledbModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = user.wallet.transactions;
    const latestTransaction = transactions[transactions.length - 1]; 
    const amount = latestTransaction ? latestTransaction.amount : 0;

    res.status(200).json({ amount });
  } catch (error) {
    console.error('Error fetching amount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Route to get the push token for a given user ID
router.get('/getPushToken/:recipientId', async (req, res) => {
  const { recipientId } = req.params;

  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ error: 'Invalid or missing Recipient ID' });
  }

  try {
    const user = await OdinCircledbModel.findById(recipientId, 'expoPushToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ pushToken: user.expoPushToken });
  } catch (error) {
    console.error('Error fetching push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/user/add',verifyToken, async (req, res) => {
  const { userId, selectedUserId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(selectedUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or selectedUserId' });
    }

    const selectedUser = await OdinCircledbModel.findById(selectedUserId, 'fullName image');

    if (!selectedUser) {
      return res.status(404).json({ success: false, message: 'Selected user not found' });
    }

    let userFriends = await UserFriendsModel.findOne({ userId });

    if (!userFriends) {
      userFriends = new UserFriendsModel({
        userId,
        selectedUsers: [{ _id: selectedUserId, fullName: selectedUser.fullName, image: selectedUser.image }],
      });
    } else {
      const isUserAlreadyAdded = userFriends.selectedUsers.some(user => user._id.equals(selectedUserId));
      if (!isUserAlreadyAdded) {
        userFriends.selectedUsers.push({ _id: selectedUserId, fullName: selectedUser.fullName, image: selectedUser.image });
      }
    }

    // Save the updated friends list
    await userFriends.save();

    res.status(200).json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Route to remove a user from the friends list
router.post('/user/remove',verifyToken, async (req, res) => {
  const { userId, selectedUserId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(selectedUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or selectedUserId' });
    }

    // Find the user's friends list
    let userFriends = await UserFriendsModel.findOne({ userId });

    if (!userFriends) {
      return res.status(404).json({ success: false, message: 'User not found in friends list' });
    }

    // Filter out the selected user from the list
    userFriends.selectedUsers = userFriends.selectedUsers.filter(user => !user._id.equals(selectedUserId));

    // Save the updated list
    await userFriends.save();

    res.status(200).json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});



// GET /transactions?page=1&limit=10
router.get('/transactions', async (req, res) => {
  const { userId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const transactions = await DebitModel.find({ userId })
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit)  
      .limit(limit);            

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/usersall",verifyToken, async (req, res) => {
  try {
    const users = await OdinCircledbModel.find();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/users",verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 1; 

    const skip = (page - 1) * limit;

    const users = await OdinCircledbModel.find().skip(skip).limit(limit);

    console.log(`Page: ${page}, Limit: ${limit}, Users returned: ${users.length}`);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get('/user/friends/:userId',verifyToken, async (req, res) => {
  const { userId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (page < 1 || limit < 1) {
    return res.status(400).json({ success: false, message: 'Invalid page or limit parameters' });
  }

  try {
    // Fetch friends for the given userId with pagination
    const friends = await UserFriendsModel.find({ userId })
      .populate('selectedUsers')
      .skip((page - 1) * limit) // Skip previous pages
      .limit(limit); // Limit the result set to the requested number of items

    const selectedUsers = friends.map(friend => friend.selectedUsers).flat();

    if (selectedUsers.length === 0) {
      return res.status(404).json({ success: false, message: 'No friends found' });
    }

    // Fetch the last message for each friend
    const friendsWithLastMessages = await Promise.all(
      selectedUsers.map(async (friend) => {
        const lastMessage = await ChatModel.findOne({ author: friend._id })
          .sort({ timestamp: -1 }) // Sort to get the latest message
          .exec();
        
        return { ...friend.toObject(), lastMessage };
      })
    );

    const totalFriends = await UserFriendsModel.countDocuments({ userId });
    const totalPages = Math.ceil(totalFriends / limit);

    return res.status(200).json({
      success: true,
      friends: friendsWithLastMessages,
      page,
      limit,
      totalPages,
      totalFriends,
    });
  } catch (error) {
    console.error('Error fetching friends with last messages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Route to get a user by ID and return their verification status
router.get('/userverified/:userId',verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch the user from the database using the provided userId
    const user = await OdinCircledbModel.findById(userId).select('verified');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the user's verified status
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

 
// routes/winners.js
router.get('/winnerstoday',verifyToken, async (req, res) => {
  try {
    // Fetch all winners without a date filter
    const allWinners = await WinnerModel.find({});

    res.status(200).json(allWinners);
  } catch (error) {
    console.error('Error fetching all winners:', error);
    res.status(500).json({ message: 'Failed to fetch all winners' });
  }
});



router.put('/withdrawAuth/:userId',verifyToken, async (req, res) => {
  const { userId } = req.params; 
  const { bvn, phone, lastName, firstName } = req.body; 

  try {
    if (!bvn) {
      return res.status(400).json({ message: 'BVN is required' });
    }

    if (bvn.length !== 11 ) {
      return res.status(400).json({ message: 'BVN must be 11 digits' });
    }

    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let withdrawAuth = await WithdrawAuthModel.findOne({ userId: user._id });

    if (!withdrawAuth) {
      withdrawAuth = new WithdrawAuthModel({
        userId: user._id,
        bvn,
        phone,
        firstName,
        lastName
      });
    } else {
      // If WithdrawAuth record exists, update BVN and NIN
      withdrawAuth.bvn = bvn;
      withdrawAuth.phone = phone;
      withdrawAuth.firstName = firstName;
      withdrawAuth.lastName = lastName;
    }

    // Save changes to the database
    await withdrawAuth.save();

    // Respond with success message
    res.json({ message: 'Withdrawal authorization updated/created successfully', withdrawAuth });
  } catch (error) {
    console.error('Error updating withdrawal authorization:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});



router.get('/user/:userId/details', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await OdinCircledbModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      amount: user.wallet?.balance || 0,
      email: user.email,
      phone: user.phone,
      bvn: user.bvn,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      wallet: user.wallet || null,
      bankDetails: user.bankDetails || null,
      referrals: user.referrals || [],
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'An error occurred while fetching user details' });
  }
});


router.post('/user/:userId/balancetopup',verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { amount, tx_ref, status} = req.body;

  try {

    const user = await TopUpModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (status === 'successful') {
      user.balance += amount; 
      await user.save(); 

      const payment = new TopUpModel({_id: tx_ref, topUpAmount: amount, userId });
      await payment.save();

      return res.status(200).json({ message: 'Balance updated successfully' });
    } else {
      return res.status(400).json({ message: 'Payment was not successful' });
    }
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/user/:userId/amounts',verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const topUps = await TopUpModel.find({ userId });

    if (!topUps || topUps.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this user' });
    }

    const transactions = topUps.map(topUp => ({
      _id: topUp._id,
      amount: topUp.amount,
      txRef: topUp.txRef,
      createdAt: topUp.createdAt
    }));

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching amounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to search users
router.get('/users/search',verifyToken, async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
   
    const searchRegex = new RegExp(query, 'i');

    // Find users matching the query
    const users = await OdinCircledbModel.find({ fullName: searchRegex })
      .skip((page - 1) * limit) 
      .limit(parseInt(limit)) 
      .select('fullName verified');

    const totalUsers = await OdinCircledbModel.countDocuments({ fullName: searchRegex });

    res.json({
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
});


router.get('/getBets',verifyToken, async (req, res) => {
  try {
    const bets = await BetModel.find(); // Fetch all bets
    res.status(200).json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to check if a room exists by roomId
router.get('/room/exists/:roomId',verifyToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    // Check if room exists
    const roomExists = await BetModel.exists({  roomId });
    if (roomExists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking room existence:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to fetch room details by roomId
router.get('/room/details/:roomId',verifyToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    // Query using the roomId field
    const room = await BetModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json(room);
  } catch (err) {
    console.error('Error fetching room details:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/room/existsdice/:roomId',verifyToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    // Check if room exists
    const roomExists = await BetModelDice.exists({  roomId });
    if (roomExists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking room existence:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch room details by roomId
// Route to fetch room details by roomId
router.get('/room/detailsdice/:roomId',verifyToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    // Query using the roomId field
    const room = await BetModelDice.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json(room);
  } catch (err) {
    console.error('Error fetching room details:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/getBetsDice',verifyToken, async (req, res) => {
  try {
    const bets = await BetModelDice.find(); // Fetch all bets
    res.status(200).json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getBetsCoin',verifyToken, async (req, res) => {
  try {
    const bets = await BetModelCoin.find(); // Fetch all bets
    res.status(200).json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getBetsRock',verifyToken, async (req, res) => {
  try {
    const bets = await BetModelRock.find(); // Fetch all bets
    res.status(200).json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/getBetsQuiz',verifyToken, async (req, res) => {
  try {
    const bets = await BetModelQuiz.find(); // Fetch all bets
    res.status(200).json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get the referral list for a specific user by userId
router.get('/referrals/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // Extract the userId from the URL parameters

    // Fetch the user and their referrals from the database
    const user = await OdinCircledbModel.findById(userId).select('fullName referrals').populate('referrals.referredUserId');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Structure the referral data to return
    const referrals = user.referrals.map((referral) => ({
      referredUserId: referral.referredUserId._id, // Populated user ID
      codeUsed: referral.codeUsed,
      email: referral.email,
      phone: referral.phone,
      status: referral.status,
      referralDate: referral.referralDate,
    }));

    // Return the referral data
    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
      },
      referrals,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving referrals.' });
  }
});

router.put('/update-withdraw-status',verifyToken, async (req, res) => {
  const { userId, withdrawConfirmed, expirationTime } = req.body;

  try {
    // Convert expirationTime to a Date object
    const expireAt = new Date(expirationTime);

    const result = await WithdrawOnceModel.findOneAndUpdate(
      { userId },
      { withdrawConfirmed, expireAt },
      { new: true, upsert: true }
    );

    if (result) {
      res.status(200).json({
        message: 'Withdrawal status updated successfully.',
        result
      });
    } else {
      res.status(404).json({
        message: 'User not found for update.',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error updating withdrawal status.',
      error: error.message,
    });
  }
});


router.get('/get-withdraw-status',verifyToken, async (req, res) => {
  const { userId } = req.query;

  try {
    const record = await WithdrawOnceModel.findOne({ userId });
    if (record) {
      res.status(200).json({
        withdrawConfirmed: record.withdrawConfirmed,
        expireAt: record.expireAt,
      });
    } else {
      res.status(404).json({ message: 'No withdrawal record found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching withdrawal status.', error });
  }
});



// Update PlayersInRoom
router.post('/updatePlayersInRoom', async (req, res) => {
  const { batchId, userId } = req.body;

  try {
    const batch = await BatchModel.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if the room is full
    if (batch.PlayersInRoom >= batch.NumberPlayers) {
      return res.status(400).json({ message: 'Room is full. No more players can join.' });
    }

      // Correctly check if the user has already joined
    const hasUserJoined = batch.joinedUsers.some(user => {
      if (typeof user === 'string') return user === userId;
      return user._id?.toString() === userId;
    });

    if (hasUserJoined) {
      return res.status(400).json({ message: 'You have already joined this game.' });
    }


    if (batch.PlayersInRoom >= batch.NumberPlayers) {
    batch.roomLocked = true;
   }

    // Add userId to joinedUsers and increment PlayersInRoom
    batch.joinedUsers.push(userId);
    batch.PlayersInRoom += 1;

    await batch.save();

    return res.status(200).json({ message: 'PlayersInRoom updated', batch });
  } catch (error) {
    console.error('Error updating PlayersInRoom:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/checkRoomStatus/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await BatchModel.findById(batchId);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({
      roomLocked: batch.roomLocked,
      playersInRoom: batch.PlayersInRoom,
      numberPlayers: batch.NumberPlayers
    });
  } catch (err) {
    console.error('Error checking room status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Remove userId if validation fails
router.post('/removeUserFromBatch', async (req, res) => {
  const { batchId, userId } = req.body;

  try {
    const batch = await BatchModel.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Remove the user from joinedUsers (since it's an array of objects)
    batch.joinedUsers = batch.joinedUsers.filter(
      (user) => user._id.toString() !== userId.toString()
    );

    // Decrease players count safely
    batch.PlayersInRoom = Math.max(0, batch.joinedUsers.length);

    await batch.save();

    return res.status(200).json({ message: 'User removed from batch', batch });
  } catch (error) {
    console.error('Error removing user from batch:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.post('/addTime', async (req, res) => {
  const { userId, cost } = req.body;

  try {
    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userBalance = parseFloat(user.wallet.balance);
    const timeCost = parseFloat(cost);

    if (isNaN(timeCost) || timeCost <= 0) {
      return res.status(400).json({ message: 'Invalid time cost' });
    }

    if (userBalance < timeCost) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct balance
    user.wallet.balance = userBalance - timeCost;
    await user.save();

    // Save usage log
    await new AddTimeLog({ userId, cost: timeCost }).save();

    return res.status(200).json({
      message: 'Time added and balance deducted',
      newBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Error adding time:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/placeBet',verifyToken, async (req, res) => {
  const { batchId, userId, betAmount } = req.body; // Expect batchId, userId, and betAmount

  try {
    const batch = await BatchModel.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userBalance = parseFloat(user.wallet.balance); 

    const requiredBet = parseFloat(batch.betAmount);
    const userBet = parseFloat(betAmount);

    if (isNaN(userBet) || userBet !== requiredBet) {
      return res.status(400).json({ message: 'Invalid or incorrect bet amount' });
    }

    if (userBalance < userBet) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

   
     user.wallet.balance = userBalance - userBet;
 
    await user.save();

    batch.betsAmountPlayer.push({ userId, betsAmount: userBet });

    await batch.save();

    return res.status(200).json({ message: 'Bet placed successfully', batch });
  } catch (error) {
    console.error('Error placing bet:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Fetch questions based on the batch level (level1 for Batch A, level2 for Batch B)
router.get('/questions/:level', async (req, res) => {
  const { level } = req.params; // "level1" or "level2"
  
// Ensure that level is valid
if (!/^Level(10|[1-9])$/.test(level)) {
  return res.status(400).json({ message: 'Invalid level' });
}

  try {
    // Fetch questions based on the level
    const questions = await QuestionModel.find({ level });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this level' });
    }

    return res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});




router.post('/saveCorrectAnswers', async (req, res) => {
  const {
    batchId,
    batchName,
    totalBetAmount,
    userId,
    correctAnswers,
    answers,
    timestamp,
  } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers must be an array.' });
  }


  try {
    let batchAnswer = await BatchAnswer.findOne({ batchId });

    if (batchAnswer) {
      const existingUserAnswer = batchAnswer.userAnswers.find(
        (user) => user.userId === userId
      );

      if (existingUserAnswer) {
        return res
          .status(400)
          .json({ message: 'Answers for this user and batch already exist.' });
      }

      batchAnswer.userAnswers.push({
        userId,
        correctAnswers,
        answers,
        timestamp: timestamp || new Date(),
      });

      await batchAnswer.save();
    } else {
      batchAnswer = new BatchAnswer({
        batchId,
        batchName,
        totalBetAmount,
        userId: [userId], // Make sure to wrap in array since your schema uses an array
        userAnswers: [
          {
            userId,
            correctAnswers,
            answers,
            timestamp: timestamp || new Date(),
          },
        ],
        timestamp: timestamp || new Date(),
      });

      await batchAnswer.save();
    }

    return res
      .status(200)
      .json({ message: 'Correct answers saved successfully', batch: batchAnswer });
  } catch (error) {
    console.error('Error saving correct answers:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.post('/api/verify-transaction',verifyToken, async (req, res) => {
  const { transaction_id, tx_ref, userId, amount,email } = req.body;

  if (!transaction_id || !tx_ref || !userId || !amount || !email) {
    return res.status(400).json({ error: 'Transaction ID, tx_ref, userId, and amount are required' });
  }

  try {
    const transactionDetails = {
      transaction_id,
      amount,
      currency: 'NGN',
      status: 'successful',
      customer: userId,
      userId,
      tx_ref,
      email
    };

    const user = await OdinCircledbModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (transactionDetails.status === 'successful') {
      const amount = parseFloat(transactionDetails.amount);

      if (!isNaN(amount) && amount > 0) {
        await OdinCircledbModel.updateOne(
          { _id: user._id },
          { $inc: { 'wallet.balance': amount } }
        );
      } else {
        console.error('Invalid transaction amount:');
      }
    }

    const newTopUp = new TopUpModel({
      userId: transactionDetails.userId,
      amount: transactionDetails.amount,
      transactionId: transactionDetails.transaction_id,
      txRef: transactionDetails.tx_ref,
      email: transactionDetails.email
    });

    await newTopUp.save();

    // Configure the email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or another email service like 'SendGrid', 'Outlook', etc.
      auth: {
        user: 'odincirclex@gmail.com', // Your email address (use environment variables for security)
        pass: 'xyqi telz pmxd evkl', // Your email password
      },
    });

    // Prepare the email content
    const mailOptions = {
      from: 'odincirclex@gmail.com',
      to: user.email, // Assuming the user model has an 'email' field
      subject: 'TopUp Successful',
      text: 'Transaction Receipt from ODINCIRCLEX LIMITED',
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
        <div style="border-bottom: 4px solid #743df9; padding-bottom: 10px; text-align: center;">
          <h1 style="margin: 20px 0; font-size: 16px; color: #743df9;">ODINCIRCLEX LIMITED</h1>
          <p style="margin: 20px 0; font-size: 8px; color: #555;">Receipt from Odincirclex Limited</p>
        </div>
  
        <div style="margin: 20px 0; background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <p style="font-size: 15px; margin: 0 10px 10px;"><strong>YOUR TOP-UP WAS SUCCESSFUL!</strong></p>
          <p style="font-size: 16px; margin: 0 0 20px;">Your account has been topped up with <strong>NGN ${amount}</strong>.</p>
  
          <h3 style="margin: 0; font-size: 18px; border-bottom: 2px solid #743df9; padding-bottom: 5px;">Payment Details</h3>
          <p style="margin: 15px 0;"><strong>Amount Paid:</strong> NGN ${amount}</p>
          <p style="margin: 15px 0;"><strong>Transaction ID:</strong> ${transaction_id}</p>
          <p style="margin: 15px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 15px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
  
        <div style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
          <p>If you have any questions or issues with this payment, kindly contact Odincirclex Limited at <a href="mailto:odincirclexlimited@gmail.com" style="color: #007bff; text-decoration: none;">odincirclexlimited@gmail.com</a>.</p>
        </div>
      </div>
    `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Success email sent to:', user.email);

    return res.status(200).json({
      message: 'Transaction verified successfully and email sent',
      data: transactionDetails,
    });
  } catch (error) {
    console.error('Error verifying transaction:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.get('/batches', async (req, res) => {
  console.log('Fetching all batches...');
  try {
        const batches = await BatchModel.find({}).sort({ createdAt: -1 }); // <- ensure fresh sort
      res.json(batches);
  } catch (err) {
      console.error('Error fetching batches:', err.message);
      res.status(500).json({ error: err.message });
  }
});

router.get('/faceoffbatches', async (req, res) => {
  console.log('Fetching all faceoffbatches...');
  try {
    const batches = await FaceOffModel.find({}).sort({ createdAt: -1 }); // <- ensure fresh sort
    res.json(batches);
  } catch (err) {
          console.error('Error fetching faceoffbatches:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Corrected backend route
router.get('/faceoffanswer', async (req, res) => {
  try {
    const { batchId, userId } = req.query;

    if (batchId && userId) {
      // Find the record where batchId matches AND userId is inside userAnswers array
      const record = await FaceOffAnswer.findOne({
        batchId,
        'userAnswers.userId': userId,
      });

      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Extract just the user's answers from userAnswers array
      const userEntry = record.userAnswers.find(entry => entry.userId === userId);
      return res.status(200).json({
        data: userEntry?.answers || [],
        correctAnswers: userEntry?.correctAnswers || 0,
        batchName: record.batchName,
      });
    }

    res.status(400).json({ message: 'Missing batchId or userId' });
  } catch (error) {
    console.error('Error fetching faceoff answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.put('/faceoffbatches/:id', async (req, res) => {
  try {
    const { userId } = req.body; // 👈 flat single value
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const batch = await FaceOffModel.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Face-Off not found' });
    }

    // Validate userId format
    const userIdStr = userId.toString();

    // Check access permission
    const allowedUserIds = batch.userIds.map((u) => u.toString());
    if (!allowedUserIds.includes(userIdStr)) {
      return res.status(403).json({ message: 'Access denied. You are not part of this face-off.' });
    }

    // Check if user already joined
    const existingJoinedUserIds = batch.joinedUsers.map((u) => u.toString());
    if (existingJoinedUserIds.includes(userIdStr)) {
      return res.status(400).json({ message: 'You already joined this face-off.' });
    }

    // Check if room is full
    if (batch.joinedUsers.length >= batch.NumberPlayers) {
      return res.status(400).json({ message: 'Room is full.' });
    }

    // Add userId to joinedUsers
    batch.joinedUsers.push(userId);
    await batch.save();

    return res.status(200).json(batch);
  } catch (error) {
    console.error('Error updating face-off batch:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

  
  








router.get('/api/trivia/scoreboard', async (req, res) => {
  try {

    const batchAnswers = await BatchAnswer.find()
    .sort({ createdAt: -1 }) // newest batches first
    .limit(50);              // only latest 50

    
    const scoreboard = [];

    for (const batch of batchAnswers) {
      const usersWithScores = [];

      for (const entry of batch.userAnswers) {
        const user = await OdinCircledbModel.findById(entry.userId).select('username fullName');

        usersWithScores.push({
          userId: entry.userId,
          username: user?.username || 'Unknown',
          fullName: user?.fullName || 'Unknown',
          correctAnswers: entry.correctAnswers,
        });
      }

      scoreboard.push({
        batchId: batch._id,
        batchName: batch.batchName,
        users: usersWithScores.sort((a, b) => b.correctAnswers - a.correctAnswers), // optional sort
      });
    }

    return res.status(200).json(scoreboard);
  } catch (error) {
    console.error('Error generating scoreboard:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.get('/api/faceoff/scoreboard', async (req, res) => {
  try {
  const batchAnswers = await FaceOffAnswer.find()
  .sort({ createdAt: -1 }) // newest batches first
  .limit(50);              // only latest 50


    const scoreboard = [];

    for (const batch of batchAnswers) {
      const usersWithScores = [];

      for (const entry of batch.userAnswers) {
        const user = await OdinCircledbModel.findById(entry.userId).select('username fullName');

        usersWithScores.push({
          userId: entry.userId,
          username: user?.username || 'Unknown',
          fullName: user?.fullName || 'Unknown',
          correctAnswers: entry.correctAnswers,
        });
      }

      scoreboard.push({
        batchId: batch._id,
        batchName: batch.batchName,
        users: usersWithScores.sort((a, b) => b.correctAnswers - a.correctAnswers), // optional sort
      });
    }

    return res.status(200).json(scoreboard);
  } catch (error) {
    console.error('Error generating scoreboard:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-batch-answers?userId=...
router.get('/api/user-batch-answers', async (req, res) => {
  const { userId, limit } = req.query;
   const limitValue = parseInt(limit) || 50;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const allBatches = await BatchAnswer.find({
      'userAnswers.userId': userId,
    }).sort({ createdAt: -1 })
    .limit(limitValue);

    // Extract only the answers for this user in each batch
    const userBatches = allBatches.map(batch => {
      const userEntry = batch.userAnswers.find(u => u.userId === userId);

      return {
        batchName: batch.batchName,
        batchId: batch.batchId,
        totalBetAmount: batch.totalBetAmount,
        answers: userEntry?.answers || [],
        correctAnswers: userEntry?.correctAnswers || 0,
        timestamp: userEntry?.timestamp,
      };
    });

    res.status(200).json({ data: userBatches });
  } catch (err) {
    console.error('Error fetching user batch answers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user-batch-answers?userId=...
router.get('/api/user-batch-faceoffanswers', async (req, res) => {
  const { userId, limit } = req.query;
   const limitValue = parseInt(limit) || 50;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const allBatches = await FaceOffAnswer.find({
      'userAnswers.userId': userId,
    }).sort({ createdAt: -1 })
   .limit(limitValue);

    // Extract only the answers for this user in each batch
    const userBatches = allBatches.map(batch => {
      const userEntry = batch.userAnswers.find(u => u.userId === userId);

      return {
        batchName: batch.batchName,
        batchId: batch.batchId,
        answers: userEntry?.answers || [],
        correctAnswers: userEntry?.correctAnswers || 0,
        timestamp: userEntry?.timestamp,
      };
    });

    res.status(200).json({ data: userBatches });
  } catch (err) {
    console.error('Error fetching user batch answers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/faceoffanswers', async (req, res) => {
  const {
    batchId,
    batchName,
    totalBetAmount,
    userId,
    correctAnswers, // 👈 changed here too
    answers,
    timestamp,
  } = req.body;
   console.log('Received data:', req.body); // ⬅️ Add this

if (!Array.isArray(answers)) {
  return res.status(400).json({ message: 'Answers must be an array.' });
}


  try {
    let faceOffAnswer = await FaceOffAnswer.findOne({ batchId });

    if (faceOffAnswer) {
      const existingUserAnswer = faceOffAnswer.userAnswers.find(
        (user) => user.userId.toString() === userId
      );

      if (existingUserAnswer) {
        return res
          .status(400)
          .json({ message: 'Answers for this user and batch already exist.' });
      }

      faceOffAnswer.userAnswers.push({
        userId,
         correctAnswers, // 👈 changed here too
        answers,
        timestamp: timestamp || new Date(),
      });

      await faceOffAnswer.save();
    } else {
      faceOffAnswer = new FaceOffAnswer({
        batchId,
        batchName,
        totalBetAmount,
        userId: [userId], // Assuming schema has this
        userAnswers: [
          {
            userId,
           correctAnswers, // 👈 changed here too
            answers,
            timestamp: timestamp || new Date(),
          },
        ],
        timestamp: timestamp || new Date(),
      });

      await faceOffAnswer.save();
    }

    return res
      .status(200)
      .json({ message: 'FaceOff answers saved successfully', batch: faceOffAnswer });
  } catch (error) {
    console.error('Error saving faceoff answers:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});



router.post('/intentToBet', async (req, res) => {
  const { batchId, userId, betAmount } = req.body;
  console.log('📥 /intentToBet called with:', req.body);

  try {
    const batchObjectId = new mongoose.Types.ObjectId(batchId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const batch = await BatchModel.findById(batchObjectId);
    if (!batch) {
      console.log('❌ Batch not found');
      return res.status(404).json({ message: 'Batch not found' });
    }
    console.log('✅ Batch found:', batch._id);

    if (batch.roomLocked) {
      console.log('🔒 Room is locked');
      return res.status(400).json({ message: 'Room is already full or locked' });
    }

    const existingIntent = await BetIntent.findOne({ batchId: batchObjectId, userId: userObjectId });
    if (existingIntent) {
      console.log('🔁 User already joined:', userObjectId);
      return res.json({ message: 'User already joined' });
    }

    const intent = new BetIntent({
      batchId: batchObjectId,
      userId: userObjectId,
      betAmount
    });
    await intent.save();
    console.log('✅ Bet intent saved:', intent);

    const totalIntents = await BetIntent.countDocuments({ batchId: batchObjectId });
    console.log('📊 Total intents for batch:', totalIntents);

    if (totalIntents >= batch.NumberPlayers) {
      batch.roomLocked = true;
      await batch.save();
      console.log('🔐 Room locked');
    }

    res.json({ message: 'Intent registered' });
  } catch (err) {
    console.error('❌ Error in /intentToBet:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// 2. When room is full – d
router.post('/deductBetsForRoom', async (req, res) => {
  const { batchId } = req.body;
  console.log('🔁 /deductBetsForRoom hit with:', req.body);

  try {
    const batchObjectId = new mongoose.Types.ObjectId(batchId); // 👈 Convert to ObjectId

    //const batch = await BatchModel.findById(batchObjectId);
    const batch = await BatchModel.findOneAndUpdate(
  { _id: batchObjectId, isProcessing: { $ne: true } }, // Only proceed if not already processing
  { isProcessing: true }, // Set lock
  { new: true }
);

if (!batch) {
  console.log('⚠️ Batch is already being processed');
  return res.status(409).json({ message: 'Batch is already being processed' });
}

    
    if (!batch) {
      console.log('❌ Batch not found');
      return res.status(404).json({ message: 'Batch not found' });
    }
    console.log('✅ Batch found:', batch._id);

    const intents = await BetIntent.find({ batchId: batchObjectId }); // 👈 Use ObjectId
    console.log('🎯 Found bet intents:', intents.length);

    if (intents.length < batch.NumberPlayers) {
      console.log('⏳ Room not full yet');
      return res.status(400).json({ message: 'Room is not full yet' });
    }

    // Validate users and their balance
    for (const intent of intents) {
      console.log(`🔍 Validating user ${intent.userId}`);

      const user = await OdinCircledbModel.findById(intent.userId);
      if (!user) {
        console.log(`❌ User ${intent.userId} not found`);
        return res.status(404).json({ message: `User ${intent.userId} not found` });
      }

      const userBalance = parseFloat(user.wallet.balance);
      const requiredBet = parseFloat(batch.betAmount);
      const userBet = parseFloat(intent.betAmount);

      if (isNaN(userBet) || userBet !== requiredBet) {
        console.log(`❌ Invalid bet amount for user ${intent.userId}: ${userBet}`);
        return res.status(400).json({ message: `Invalid bet for user ${intent.userId}` });
      }


    }

    // Deduct balances and update batch
    for (const intent of intents) {
      const alreadyDeducted = batch.betsAmountPlayer.some(
        (b) => String(b.userId) === String(intent.userId)
      );
      if (alreadyDeducted) {
        console.log(`↪️ Already deducted for user ${intent.userId}, skipping...`);
        continue;
      }

      const user = await OdinCircledbModel.findById(intent.userId);
      const userBet = parseFloat(intent.betAmount);
      console.log(`💸 Deducting ${userBet} from user ${user._id}`);

      user.wallet.balance -= userBet;
      await user.save();
      console.log(`💾 Saved user ${user._id} new balance: ${user.wallet.balance}`);

      batch.betsAmountPlayer.push({
        userId: intent.userId,
        betsAmount: userBet,
      });
    }

    batch.isProcessing = false;
    batch.status = 'started';
    batch.roomLocked = true;
    await batch.save();
    console.log('🏁 Batch updated: started and locked');

    return res.json({ message: 'Bets deducted, game ready to start' });

  } catch (error) {
    console.error('❌ Deduct error:', error);
    // Reset the lock if something fails
   await BatchModel.findByIdAndUpdate(batchId, { isProcessing: false });
    return res.status(500).json({ message: 'Server error during bet deduction' });
  }
});


module.exports = router;
