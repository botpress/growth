import axios, { AxiosError } from "axios";
export const handleAxiosError = (error: AxiosError) => {
  // Handle the error
  if (error.response) {
    // Server responded with a status other than 2xx
    console.log("Error status:", error.response.status);
    console.log("Error data:", error.response.data);
  } else if (error.request) {
    // Request was made, but no response was received
    console.log("No response received:", error.request);
  } else {
    // Something else went wrong
    console.log("Error message:", error.message);
  }
};

export const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};
