const nibssApi = require("../Config/nibss");

// ======================================================
// NIBSS TOKEN CACHE
// ======================================================

let nibssToken = null;
let tokenExpiry = null;

const generateNibssToken = async () => {
  // Reuse existing token if it is still valid
  if (nibssToken && tokenExpiry && tokenExpiry > Date.now()) {
    console.log("Using cached NIBSS token");
    return {
      token: nibssToken,
    };
  }

  try {
    console.log("Generating new NIBSS token...");

    const response = await nibssApi.post("/api/auth/token", {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_API_SECRET,
    });

    if (!response.data || !response.data.token) {
      throw new Error("NIBSS did not return a valid token");
    }

    nibssToken = response.data.token;

    // Keep token for 55 minutes
    tokenExpiry = Date.now() + 55 * 60 * 1000;

    console.log("NIBSS token generated successfully");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS token generation failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// BVN
// ======================================================

const insertBvn = async (data, token) => {
  try {
    const response = await nibssApi.post("/api/insertBvn", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS BVN insertion failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


const validateBvn = async (data, token) => {
  try {
    const response = await nibssApi.post("/api/validateBvn", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS BVN validation failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// NIN
// ======================================================

const insertNin = async (data, token) => {
  try {
    const response = await nibssApi.post("/api/insertNin", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS NIN insertion failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


const validateNin = async (data, token) => {
  try {
    const response = await nibssApi.post("/api/validateNin", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS NIN validation failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// ACCOUNT CREATION
// ======================================================

const createNibssAccount = async (accountData, token) => {
  try {
    console.log("Creating account with NIBSS...");

    const response = await nibssApi.post(
      "/api/account/create",
      accountData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("NIBSS account creation response:");
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS account creation failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// NAME ENQUIRY
// ======================================================

const nameEnquiry = async (accountNumber, token) => {
  try {
    console.log(`Performing NIBSS name enquiry for ${accountNumber}...`);

    const response = await nibssApi.get(
      `/api/account/name-enquiry/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("NIBSS name enquiry successful");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS name enquiry failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// BALANCE
// ======================================================

const getAccountBalance = async (accountNumber, token) => {
  try {
    const response = await nibssApi.get(
      `/api/account/balance/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS balance enquiry failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// TRANSFER
// ======================================================

const transferFunds = async (transferData, token) => {
  try {
    console.log("Processing NIBSS transfer...");

    console.log("NIBSS transfer payload:");
    console.log(transferData);

    const response = await nibssApi.post(
      "/api/transfer",
      transferData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("NIBSS transfer completed");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS transfer failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};


module.exports = {
  generateNibssToken,
  insertBvn,
  validateBvn,
  insertNin,
  validateNin,
  createNibssAccount,
  nameEnquiry,
  getAccountBalance,
  transferFunds,
};
