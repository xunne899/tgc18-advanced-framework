const express = require('express')
const router = express.Router();

// import in the Product model
const { Product, Category, Tag } = require('../models')
const { createProductForm, bootstrapField } = require('../forms');
const { checkIfAuthenticated } = require('../middlewares');

router.get('/', async function (req, res) {
    // fetch all the products
    // use the bookshelf syntax 
    // => select * from products
    let products = await Product.collection().fetch({
        'withRelated':['category', 'tags']
    });
    res.render('products/index', {
        products: products.toJSON()
    })
})

router.get('/create', checkIfAuthenticated, async function (req, res) {

    // fetch all the categories in the system
    const categories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });

    const tags = await Tag.fetchAll().map(tag => {
        return [tag.get('id'), tag.get('name')]
    });

    // if not using map function
    // const c = [];
    // for (let c of (await Category.fetchAll())) {
    //     c.push([c.get('id'), c.get('name')])
    // }

    const productForm = createProductForm(categories, tags);

    res.render('products/create', {
        // get a HTML version of the form formatted using bootstrap
        form: productForm.toHTML(bootstrapField)
    })
})

router.post('/create', checkIfAuthenticated, async function (req, res) {
    // fetch all the categories in the system
    const categories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });
    const productForm = createProductForm(categories);
    productForm.handle(req, {
        'success': async function (form) {
            // the success function is called if the form has no validation errors
            // the form argument contains what the user has type in


            // we need to do the eqv of INSERT INTO products (name, description, cost)
            //                          VALUES (form.data.name, form.data.description, form.data.cost)

            // The MODEL represents the table
            // ONE instance of the the MODEL represents a row
            const product = new Product();  // create a new instance of the Product model (i.e represents a new row)
            product.set('name', form.data.name);
            product.set('cost', form.data.cost);
            product.set('description', form.data.description);
            product.set('category_id', form.data.category_id);
            // must remeber to save
            await product.save();
            if (form.data.tags) {
                // form.data.tags will contain the IDs of the selected tag seprated by a comma
                // for example: "1,3"
                await product.tags().attach(form.data.tags.split(','))
            }
            // req.flash is available because we did a app.use(flash()) inside index.js
            req.flash("success_messages", `New product ${product.get('name')} has been created`)
            res.redirect('/products')


        },
        'error': function (form) {
            // the error function is called if the form has validation errors
            res.render('products/create', {
                'form': form.toHTML(bootstrapField)
            })
        },
        'empty': function (form) {
            // the empty function is called if the form is not filled in at all
        }
    })
})

// targete URL: /products/:product_id/update
router.get('/:product_id/update', async function (req, res) {
    // 1. get the product that is being updated
    // select * from products where product_id = <req.params.product_id>
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        withRelated:['tags'], // fetch all the tags associated with the product
        require: true  // if not found will cause an exception (aka an error)
    })
    // 2. create the form to update the product
    const categories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });

    const tags = await Tag.fetchAll().map( t => {
        return [t.get('id'), t.get('name')]
    })

    const productForm = createProductForm(categories, tags);

    // 3. fill the form with the previous values of the product
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');
    productForm.fields.category_id.value = product.get('category_id');

    // fill in the multi-select for tags
    // product.related('tags') will return an array of tag objects
    // use pluck to retrieve only the id from each tag object
    let selectedTags = await product.related('tags').pluck('id');
    console.log(selectedTags);
    productForm.fields.tags.value = selectedTags;

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON()

    })
})

router.post('/:product_id/update', async function (req, res) {
    const categories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });
    const productForm = createProductForm(categories);

    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        withRelated:['tags'],
        require: true  // if not found will cause an exception (aka an error)
    })

    // handle function will run the validation on the data
    productForm.handle(req, {
        'success': async function (form) {
            // the form arguments contain whatever the user has typed into the form
            // update products set name=?, cost=?, description=? where product_id=?
            // product.set('name', form.data.name);
            // product.set('description', form.data.description);
            // product.set('cost', form.data.cost);
            // product.set('category_id, form.data.category_id);
            let { tags, ...productData} = form.data;
          
            product.set(productData);  // for the shortcut to work,
            await product.save();
            // all the keys in form.data object
            // must be a column name in the table

            // get all the selected tags as an array
            let tagIds = tags.split(',').map( id => parseInt(id));
            // get an array that contains the ids of the existing tags
            let existingTagIds = await product.related('tags').pluck('id');

            // remove all the current tags that are not selected anymore
            let toRemove = existingTagIds.filter( id => tagIds.includes(id) === false)
     
            await product.tags().detach(toRemove)

            // add in all the tags from the form that are not in the product
            await product.tags().attach(tagIds);

            // alternate method (easier to implement but less efficient)
            // await products.tags.detach(existingTagIds);
            // await product.tags.attach(tagIds);

       
            res.redirect('/products')
        },
        'error': async function (form) {
            res.render('products/update', {
                'product': product.toJSON(),
                'form': form.toHTML(bootstrapField)
            })
        },
        'empty': async function (form) {
            res.render('products/update', {
                'product': product.toJSON(),
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/:product_id/delete', async function (req, res) {
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        'require': true
    })
    res.render('products/delete', {
        'product': product.toJSON()
    })
})

router.post('/:product_id/delete', async function (req, res) {
    const product = await Product.where({
        id: req.params.product_id
    }).fetch({
        require: true
    })

    await product.destroy();
    res.redirect('/products')
})

module.exports = router;