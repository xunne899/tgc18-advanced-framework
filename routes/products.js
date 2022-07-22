const express =require('express')

const router = express.Router();


const{Product} = require('../models')

router.get('/', async function(req,res){
    let products =await Product.collection().fetch();
    res.render('products/index',{
        products:products.toJSON()
    })
})

router.get('/create', function(req,res){
    res.send("create products")
})

module.exports = router