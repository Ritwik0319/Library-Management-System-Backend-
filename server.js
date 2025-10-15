import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./config/config.env" });

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
