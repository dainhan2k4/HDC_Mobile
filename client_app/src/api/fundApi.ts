import axios from "axios";

const API_URL = "http://localhost:11018/data_fund/";

export const getFunds = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

