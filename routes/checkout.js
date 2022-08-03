const express = require('express');
const { checkIfAuthenticated } = require('../middlewares');
const router = express.Router();
const cartServices = require('../services/carts');

const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/', checkIfAuthenticated, async function(req,res){
    // step 1: create the line items
    // one line in the invoice is one line item4
    // each item in the shopping cart will become line item
    const items = await cartServices.getCart(req.session.user.id);

    let lineItems = [];
    let meta = []; // metadata -- and we are going store for
                   // each product id how many the user is buying (i.e the quantity)
    for (let item of items) {
        // each keys in the line item is prefixed by Stripe
        const eachLineItem = {
            'name': item.related('product').get('name'),
            'amount': item.related('product').get('cost'),
            'quantity': item.get('quantity'),
            'currency': 'SGD'
        }

        // check if there's an image
        if (item.related('product').get('image_url')) {
            // Stripe expect images to be an array
            eachLineItem.images = [item.related('product').get('image_url')];
        }

        lineItems.push(eachLineItem);
        meta.push({
            product_id: item.get('product_id'),
            quantity: item.get('quantity')
        })
    }

    // step 2: create stripe payment
    // the metadata must be a string
    let metaData = JSON.stringify(meta);
    // the key/value pairs in the payment are defined by Stripes
    const payment = {
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: process.env.STRIPE_SUCCESS_URL 
        + 
        "?sessionId={CHECKOUT_SESSION_ID}"
        ,
        cancel_url: process.env.STRIPE_CANCEL_URL,
        // in the metadata, the keys are up to us
        // but the value MUST BE A STRING
        metadata: {
            'orders': metaData,
            'user_id': req.session.user.id
        }
    }

    // step 3: register the payment session
    let stripeSession = await Stripe.checkout.sessions.create(payment);

    // step 4: use stripe to pay
    res.render('checkout/checkout',{
        sessionId: stripeSession.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    })
})

router.get('/success', function(req,res){
    res.send("Payment success")
})

router.get('/cancelled', function(req,res){
    res.send("Payment cancelled")
})

// Webhook for Stripe
// has to be POST -- 1) we are changing our database on based on payment info
//                   2) Stripe decides that way
router.post('/process_payment', express.raw({type:'application/json'}), async function(req,res){
    let payload = req.body; // payment information is inside req.body
    let endpointSecret = process.env.STRIPE_ENDPOINT_SECRET; // each webhook will have one endpoint secret
                                                             // ensures that Stripe is the one sending the information
    let sigHeader = req.headers["stripe-signature"]; // when strip sends us the information, there will be a signature in the header
                                                     // the key will be `stripe-signature`
    let event = null;
    // try to extract out the information and ensures that its' legit (it acutally comes from Stripe)
    try {
        event = Stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);
        if (event.type == 'checkout.session.completed') {
            console.log(event.data.object);
            const metadata = JSON.parse(event.data.object.metadata.orders);
            console.log(metadata);
            res.send({
                'success': true
            })
        }  // checkout.session.completed ==> the payment is done
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }                                                          
})

module.exports = router;