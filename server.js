const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к MongoDB Atlas
mongoose.connect("mongodb+srv://natalinadaria:0T7tkFLGSkykYl9o@mkdiplomanatalina.nulekil.mongodb.net/MK_Web_app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Схема продукта
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

// Модель
const Product = mongoose.model("Product", ProductSchema, "Products");

// Эндпоинт для получения всех товаров
app.get("", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении товаров: ", error });
  }
});

// Запуск сервера
app.listen(5000, () => {
  console.log("Сервер работает на http://localhost:5000");
});