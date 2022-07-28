const bookshelf = require('../bookshelf'); // 
// by default if we require a folder,
// nodejs will look for index.js

// a Bookshelf Model represents one table
// the name of the model (the first arg)
// must be the SINGULAR form of the table name
// and the first letter MUST be uppercase
const Product = bookshelf.model('Product', {
    tableName: 'products',
    // for the belongsTo, the name of the function is the name of the relationship
    // the name MUST match the model name, but singular and always lowercase
    category: function(){
        return this.belongsTo('Category');
    },
    tags:function(){
        return this.belongsToMany('Tag');
    }
})

const Category = bookshelf.model('Category',{
    tableName: 'categories',
    // the name of the function for a HasMany relationship
    // should be the plural form of the corrsponding model in plural form
    // and all lower case
    products:function(){
        return this.hasMany('Product')
    }
})

const Tag = bookshelf.model('Tag', {
    'tableName':'tags',
    products:function(){
        // the first arg of belongsToMany must be a MODEL name
        return this.belongsToMany('Product')
    }
})

module.exports = { Product, Category, Tag };