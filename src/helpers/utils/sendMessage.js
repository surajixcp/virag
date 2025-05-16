const axios = require("axios");

module.exports = {
    sendOtp: async (phoneNumber, otp) => {
        const apiUrl = "https://www.bulksmsindia.app/V2/http-api-post.php";
        // API credentials
        const apiKey = "0bQk8AZ2AsYX96hz"; // Replace with your actual API key
        const senderId = "VlRAAG"; // Replace with your approved Sender ID
        const messageTemplate = `Your OTP for VIRAAG login is ${otp}. It's valid for 5 minutes. Keep it safe!`; // Replace with your approved message template
        const requestBody = {
            apikey: apiKey,      // API Key
            senderid: senderId,  // Sender ID
            number: phoneNumber, // Recipient's phone number
            message: messageTemplate, // OTP message
            format: "json",      // API response format
          };
        try {
          // Send the request to the Bulk SMS India API
          const response = await axios.post(apiUrl,requestBody);
            // Log the response from the API
            console.log("SMS sent successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error sending SMS:", error.response?.data || error.message);
            throw new Error("Failed to send OTP. Please try again.");
        }
    }

}