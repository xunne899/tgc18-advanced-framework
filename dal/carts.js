const { CartItem } = require('../models');

const getCart = async (userId) => {
    return await CartItem.collection().where({
        'user_id': userId
    }).fetch({
        require: false,
        withRelated:['product', 'product.category']
    })
}

const getCartItemByUserAndProduct = async (userId, productId) => {
    return await CartItem.where({
        'user_id': userId,
        'product_id': productId
    }).fetch({
        require:false
    })
}

// userId -- which user is adding the item
// productId -- which product is being added
// quantity -- the quantity of the product
const createCartItem = async(userId, productId, quantity) => {
    // the name of the Model is the table
    // an instance of the Model is one row in the table
    const cartItem = new CartItem({
        'user_id': userId,
        'product_id': productId,
        'quantity': quantity
    });
    await cartItem.save();
    return cartItem;
}

const updateQuantity = async (userId, productId, newQuantity) => {
    const cartItem = await getCartItemByUserAndProduct(userId, productId);
    if (cartItem) {
        // update the cart item
        cartItem.set('quantity', newQuantity);
        await cartItem.save();
    } else {
        return false;
    }
}
const removeCartItem = async (userId, productId) => {
    const cartItem = await getCartItemByUserAndProduct(userId, productId);
    await cartItem.destroy();
    return true;
}

module.exports = { getCart, createCartItem, getCartItemByUserAndProduct, updateQuantity, removeCartItem }