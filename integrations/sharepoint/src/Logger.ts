import axios from "axios";
import { log } from "console";

const LOGGER_URL = "https://336e-173-177-137-141.ngrok-free.app";

export const logToExternalService = async (message: string) => {
  try {
    console.log(`Logging to external service: "${message}"`);
    await axios.post(LOGGER_URL, { message });
  } catch (e) {
    console.error("Failed to log to external service", e);
  }
};
