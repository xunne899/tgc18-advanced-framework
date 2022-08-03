const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {checkIfAuthenticatedJWT} = require('../../middlewares')

const generateAccessToken = function (username, id, email, tokenSecret, expiry) {
    // 1st arg -- payload
    return jwt.sign({
        username, id, email
    }, tokenSecret, {
        expiresIn: expiry
    })
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    // the output will be converted to hexdecimal
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const { User, BlacklistedToken } = require('../../models')


router.post('/login', async function (req, res) {
    const user = await User.where({
        'email': req.body.email,
        'password': getHashedPassword(req.body.password)
    }).fetch({
        require: false
    });
    // if the user with the provided email and password is found
    if (user) {
        const accessToken = generateAccessToken(user.get('username'), 
                user.get('id'),
                user.get('email'), 
                process.env.TOKEN_SECRET, 
                '1h');


        const refreshToken = generateAccessToken(user.get('username'),
                user.get('id'),
                user.get('email'), process.env.REFRESH_TOKEN_SECRET, '7d')

        res.json({
            'accessToken': accessToken,
            'refreshToken': refreshToken
        })
    } else {
        // error
        res.status(401);
        res.json({
            'error': 'Invalid email or password'
        })
    }
});

router.get('/profile', checkIfAuthenticatedJWT, function(req,res){
    const user = req.user;
    res.json(user);
})

// this route to get a new access token
router.post('/refresh', async function(req,res){
    // get the refreshtoken from the body
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {

        // check if the token is already blacklisted
        const blacklistedToken = await BlacklistedToken.where({
            'token': refreshToken
        }).fetch({
            require: false
        })

        // if the blacklistedToken is NOT null, then it means it exist
        if (blacklistedToken) {
            res.status(400);
            res.json({
                'error':'Refresh token has been blacklisted'
            })
            return;
        }

        // verify if it is legit 
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, function(err,tokenData){
            if (!err) {
                // generate a new access token and send back
                const accessToken = generateAccessToken(tokenData.userName,
                         tokenData.id,
                         tokenData.email, 
                         process.env.TOKEN_SECRET,
                         '1h');
                res.json({
                    accessToken
                })
            } else {
                res.status(400);
                res.json({
                    'error': 'Invalid refresh token'
                })
            }
        })
    } else {
        res.status(400);
        res.json({
            'error':'No refresh token found'
        })
    }
})

router.post('/logout', async function(req,res){
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
        // add the refresh token to the black list
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async function(err, tokenData){
            if (!err) {
                // add the refresh token to the black list
                const token = new BlacklistedToken();
                token.set('token', refreshToken);
                token.set('date_created', new Date()); 
                await token.save();
                res.json({
                    'message':'Logged out'
                })
            }
        })
    } else {
        res.status(400);
        res.json({
            'error':'No refresh token found!'
        })
    }
})

module.exports = router;