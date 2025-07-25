const TransOtpVerify = require('../models/TransOtpVerify');

const verifyWithdrawalOtp = async ({ userId, otp, totalAmount, amount, title, message, fullName }) => {
  if (!otp || !userId) {
    throw new Error('Missing OTP or user ID');
  }

  const otpRecord = await TransOtpVerify.findOne({ userId, otp });
  if (!otpRecord) {
    throw new Error('Incorrect or expired OTP');
  }

  // ✅ Optional: Check if OTP is expired (e.g., older than 10 minutes)
  const now = new Date();
  const createdAt = new Date(otpRecord.createdAt);
  const diffInMinutes = (now - createdAt) / (1000 * 60);
  if (diffInMinutes > 10) {
    await TransOtpVerify.deleteOne({ _id: otpRecord._id });
    throw new Error('OTP has expired');
  }

  // ✅ Mark OTP as used
  await TransOtpVerify.deleteOne({ _id: otpRecord._id });

  return {
    verified: true,
    info: 'OTP verified successfully',
  };
};

module.exports = verifyWithdrawalOtp;
