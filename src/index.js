import 'dotenv/config';
import connectionDB from "./db/connect.js";


connectionDB();


/*
=> This is one way to connect to database
import express from "express";
const app = express();
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        app.on("error", (err) => {
            console.log("It took too long to connect",err);
        });
        app.listen(process.env.PORT, ()=>console.log(`App is listening at ${process.env.PORT}`));
        console.log("DB Connected succesfully");
    } catch (error) {
        console.log("Error occured connection Failed", error);
        throw error;//* for manually throwing error 
        process.exit(1);
    }
})();
*/