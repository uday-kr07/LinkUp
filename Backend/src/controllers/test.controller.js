import fs from "fs";
import imagekit from "../utils/imagekit.js";

const uploadTest = async () => {
    try {
        const response = await imagekit.upload({
            file: fs.readFileSync("./test.jpg"),
            fileName: "test.jpg"
        });

        console.log(response);
    } catch (error) {
        console.log(error);
    }
};

export default uploadTest;