const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  ingredients: String,
  f_category: String,
  s_category: String,
  t_category: [String],
  images: [String],
  value: Number,
  value_descriptor: String,
  rating: Number,
});

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema, "Products");
