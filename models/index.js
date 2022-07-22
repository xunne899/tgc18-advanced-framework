const bookshelf = require('../bookshelf');

// a book
const Product = bookshelf.model('Product', {
    tableName:'products'
});

module.exports = { Product };