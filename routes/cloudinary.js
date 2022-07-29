const express = require('express');
const router = express.Router();

const cloudinary = require('cloudinary');
// configure cloudinary
cloudinary.config({
    'api_key':process.env.CLOUDINARY_API_KEY,
    'api_secret': process.env.CLOUDINARY_API_SECRET
})

// this will be called by the Cloudinary widget
router.get('/sign', async function(req,res){
    const params_to_sign = JSON.parse(req.query.params_to_sign)

    // retrieve the api secret
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // get the signature (aka the CSRF from cloudinary)
    const signature = cloudinary.utils.api_sign_request(params_to_sign, apiSecret );

    // send back the signature to the cloudinary widget
    res.send(signature);
})

module.exports = router;