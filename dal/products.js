
const { Product, Category, Tag} = require('../models');

async function getAllCategories() {
    const categories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });
    return categories;
}

async function getAllTags() {
    const tags = await Tag.fetchAll().map(tag => {
        return [tag.get('id'), tag.get('name')]
    });
    return tags;
}

async function getProductByID(productId) {
    const product = await Product.where({
        'id': productId
    }).fetch({
        withRelated: ['tags'], // fetch all the tags associated with the product
        require: true  // if not found will cause an exception (aka an error)
    })
    return product;
}

module.exports = { getAllCategories, getAllTags, getProductByID};