import ImageKit from "imagekit";

const noProxy = [
    process.env.NO_PROXY,
    process.env.no_proxy,
    "upload.imagekit.io",
].filter(Boolean).join(",");

process.env.NO_PROXY = noProxy;
process.env.no_proxy = noProxy;

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const uploadOnImageKit = async (file) => {
    try {
        if (!file?.buffer) return null;

        const response = await imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
            useUniqueFileName: true,
        });

        return response;
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        return null;
    }
};



console.log({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? "OK" : "MISSING",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "OK" : "MISSING",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});



export default imagekit;
export { uploadOnImageKit };

