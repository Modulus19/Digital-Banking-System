const axios = require("axios");

const nibssApi = axios.create({
  baseURL: process.env.NIBSS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = nibssApi;
