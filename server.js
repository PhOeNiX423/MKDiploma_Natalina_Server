const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
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
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении товаров", error });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});