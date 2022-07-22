const express = require("express");
const router = express.Router();

// import in the Product model
const { Product } = require("../models");
const { createProductForm, bootstrapField } = require("../forms");

router.get("/", async function (req, res) {
  // fetch all the products
  // use the bookshelf syntax
  // => select * from products
  let products = await Product.collection().fetch();
  res.render("products/index", {
    products: products.toJSON(),
  });
});

router.get("/create", function (req, res) {
  const productForm = createProductForm();
  res.render("products/create", {
    // get a HTML version of the form formatted using bootstrap
    form: productForm.toHTML(bootstrapField),
  });
});

router.post("/create", function (req, res) {
  const productForm = createProductForm();
  productForm.handle(req, {
    success: async function (form) {
      // the success function is called if the form has no validation errors
      // the form argument contains what the user has type in

      // we need to do the eqv of INSERT INTO products (name, description, cost)
      //                          VALUES (form.data.name, form.data.description, form.data.cost)

      // The MODEL represents the table
      // ONE instance of the the MODEL represents a row
      const product = new Product(); // create a new instance of the Product model (i.e represents a new row)
      product.set("name", form.data.name);
      product.set("cost", form.data.cost);
      product.set("description", form.data.description);
      // must remeber to save
      await product.save();
      res.redirect("/products");
    },
    error: function (form) {
      // the error function is called if the form has validation errors
      res.render("products/create", {
        form: form.toHTML(bootstrapField),
      });
    },
    empty: function (form) {
      // the empty function is called if the form is not filled in at all
    },
  });
});

module.exports = router;
