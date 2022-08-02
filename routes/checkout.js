const express = require('express');
const router = express.Router();
const cartServices = require('../services/carts');

const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/', async function(req,res){
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
        success_url: 'http://www.google.com',
        cancel_url: 'http://www.yahoo.com',
        // in the metadata, the keys are up to us
        // but the value MUST BE A STRING
        metadata: {
            'orders': metaData
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

module.exports = router;