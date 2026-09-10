const nibssApi = require("../Config/nibss");

const generateNibssToken = async () => {
  const response = await nibssApi.post("/api/auth/token", {
    apiKey: process.env.NIBSS_API_KEY,
    apiSecret: process.env.NIBSS_API_SECRET,
  });

  return response.data;
};

const insertBvn = async (bvnData, token) => {
  const response = await nibssApi.post("/api/insertBvn", bvnData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const validateBvn = async (bvn, token) => {
  const response = await nibssApi.post(
    "/api/validateBvn",
    { bvn },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

const insertNin = async (ninData, token) => {
  const response = await nibssApi.post("/api/insertNin", ninData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const validateNin = async (nin, token) => {
  const response = await nibssApi.post(
    "/api/validateNin",
    { nin },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

const createNibssAccount = async (accountData, token) => {
  try {
    console.log("Creating account with NIBSS...");

    const response = await nibssApi.post("/api/account/create", accountData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("NIBSS account created successfully");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS account creation error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

const nameEnquiry = async (accountNumber, token) => {
  try {
    console.log("Performing NIBSS name enquiry...");

    const response = await nibssApi.get(
      `/api/account/name-enquiry/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("Name enquiry successful");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS name enquiry error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

const getAccountBalance = async (accountNumber, token) => {
  try {
    console.log("Getting account balance from NIBSS...");

    const response = await nibssApi.get(
      `/api/account/balance/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("Account balance retrieved successfully");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS account balance error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

const transferFunds = async (transferData, token) => {
  try {
    console.log("Processing NIBSS transfer...");

    const response = await nibssApi.post("/api/transfer", transferData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("NIBSS transfer completed");

    return response.data;
  } catch (error) {
    console.error(
      "NIBSS transfer error:",
      error.response?.data || error.message,
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
