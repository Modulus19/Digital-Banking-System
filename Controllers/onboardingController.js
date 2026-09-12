const Customer = require("../Models/customer.model");
const IdentityVerification = require("../Models/identityVerification.model");

const {
  generateNibssToken,
  validateBvn,
  validateNin,
} = require("../Services/nibssService");

// ===============================
// BVN ONBOARDING
// ===============================

const onboardWithBvn = async (req, res, next) => {
  try {
    const { bvn } = req.body;

    // 1. Find the logged-in customer
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 2. Check if customer already has a verified identity
    if (customer.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Customer has already completed identity verification",
      });
    }

    // 3. Generate NIBSS JWT
    const nibssResponse = await generateNibssToken();

    const token = nibssResponse.token;

    // 4. Validate BVN with NIBSS
    const verificationResponse = await validateBvn(bvn, token);

    // 5. Save verification details
    await IdentityVerification.findOneAndUpdate(
      { customer: customer._id },
      {
        customer: customer._id,
        verificationType: "bvn",
        bvn,
        dob: verificationResponse?.data?.dob || null,
        status: "verified",
        verificationReference: bvn,
        provider: "NIBSS By Phoenix",
        verifiedAt: new Date(),
        failureReason: null,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    // 6. Update customer
    customer.onboardingStatus = "verified";
    customer.identityType = "bvn";
    customer.isVerified = true;

    await customer.save();

    // 7. Return response
    return res.status(200).json({
      success: true,
      message: "Customer BVN onboarding completed successfully",
      data: {
        customerId: customer._id,
        identityType: "bvn",
        onboardingStatus: customer.onboardingStatus,
        isVerified: customer.isVerified,
        verification: verificationResponse,
      },
    });
  } catch (error) {
    console.error(
      "BVN onboarding error:",
      error.response?.data || error.message,
    );

    // Handle NIBSS errors
    if (error.response) {
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || "BVN verification failed",
        error: error.response.data || null,
      });
    }

    next(error);
  }
};

// ===============================
// NIN ONBOARDING
// ===============================

const onboardWithNin = async (req, res, next) => {
  try {
    const { nin } = req.body;

    // 1. Find the logged-in customer
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 2. Check if customer already has a verified identity
    if (customer.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Customer has already completed identity verification",
      });
    }

    // 3. Generate NIBSS JWT
    const nibssResponse = await generateNibssToken();

    const token = nibssResponse.token;

    // 4. Validate NIN with NIBSS
    const verificationResponse = await validateNin(nin, token);

    // 5. Save verification details
   await IdentityVerification.findOneAndUpdate(
     { customer: customer._id },
     {
       customer: customer._id,
       verificationType: "nin",
       nin,
       dob:
         verificationResponse?.data?.dob ||
         verificationResponse?.response?.dob ||
         null,
       status: "verified",
       verificationReference: nin,
       provider: "NIBSS By Phoenix",
       verifiedAt: new Date(),
       failureReason: null,
     },
     {
       upsert: true,
       new: true,
       runValidators: true,
     },
   );

    // 6. Update customer
    customer.onboardingStatus = "verified";
    customer.identityType = "nin";
    customer.isVerified = true;

    await customer.save();

    // 7. Return response
    return res.status(200).json({
      success: true,
      message: "Customer NIN onboarding completed successfully",
      data: {
        customerId: customer._id,
        identityType: "nin",
        onboardingStatus: customer.onboardingStatus,
        isVerified: customer.isVerified,
        verification: verificationResponse,
      },
    });
  } catch (error) {
    console.error(
      "NIN onboarding error:",
      error.response?.data || error.message,
    );

    // Handle NIBSS errors
    if (error.response) {
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || "NIN verification failed",
        error: error.response.data || null,
      });
    }

    next(error);
  }
};

module.exports = {
  onboardWithBvn,
  onboardWithNin,
};
