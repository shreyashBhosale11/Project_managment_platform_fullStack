import dotenv from "dotenv";
import app from "./app.js";
import connetDB from "./db/index.js"

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 3000;

connetDB()
    .then(()=>{
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) =>{
        console.error("MongoDB connection error" , err)
        process.exit(1)
    })