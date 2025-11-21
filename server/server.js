import dotenv from "dotenv";
import app from "./app.js";        
import connectDB from "./src/config/db.js";

dotenv.config();

// Connect Database
connectDB();

// Start Server 
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
