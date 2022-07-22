const express =require ('express')

const router =express.Router()


// router.get('/', (req,res)=>{
//     res.send("Welcome to our Postershop")
// })

// no need to put view/landing/index
// by default take look on view ==> landing/index will do 
router.get('/', (req,res)=>{
    res.render('landing/index')
})



router.get('/about-us', (req,res)=>{
    res.render('landing/about-us')
})

router.get('/contact-us', (req,res)=>{
    res.render('landing/contact-us')
})

module.exports = router;