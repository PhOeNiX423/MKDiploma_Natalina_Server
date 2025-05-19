const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://mkdiploma-natalina.vercel.app"], // ← список разрешённых источников
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===================== СХЕМЫ И МОДЕЛИ =====================

// ✅ Продукты
const ProductSchema = new mongoose.Schema({
  title: String,
  product_line: String,
  item_code: String,
  price: Number,
  description: String,
  ingredients: String,
  category: String,
  target_area: String,
  tags: [String],
  value: String,
  value_descriptor: String,
  images: [String],
  average_rating: Number,
  ratings_count: Number,
});

const Product = mongoose.model("Product", ProductSchema, "Products");

// ✅ Отзывы
const ReviewSchema = new mongoose.Schema({
  product_id: mongoose.Schema.Types.ObjectId,
  user_id: mongoose.Schema.Types.ObjectId,
  rating: Number,
  comment: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model("Review", ReviewSchema, "Reviews");

// ✅ Пользователи
const UserSchema = new mongoose.Schema({
  login: String,
  password_hash: String,
  name: String,
  role: {
    type: String,
    default: "user", // ← по умолчанию
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, { versionKey: false });;

const User = mongoose.model("User", UserSchema, "Users");

// ✅ Заказы
const OrderSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  name: String,
  phone: String,
  products: [
    {
      product_id: mongoose.Schema.Types.ObjectId,
      title: String,
      quantity: Number,
      price: Number,
    },
  ],
  total_amount: Number,
  status: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
  city: String,
  district: String,
  metro: String,
  comment: String,
}, { versionKey: false });

const Order = mongoose.model("Order", OrderSchema, "Orders");

// ===================== ЭНДПОИНТЫ =====================

// 🔹 Все продукты
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении товаров", error });
  }
});

// 🔹 Один продукт
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Товар не найден" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении товара", error });
  }
});

// 🔹 Все отзывы
app.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении отзывов", error });
  }
});

// 🔹 Отзывы по товару
app.get("/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.productId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении отзывов", error });
  }
});

// 🔹 Отзывы конкретного пользователя
app.get("/reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Неверный формат userId" });
    }

    const reviews = await Review.find({ user_id: new mongoose.Types.ObjectId(userId) });
    res.json(reviews);
  } catch (error) {
    console.error("Ошибка при получении отзывов пользователя:", error);
    res.status(500).json({ message: "Ошибка при получении отзывов пользователя", error });
  }
});

// 🔹 Добавить отзыв и обновить рейтинг
app.post("/reviews", async (req, res) => {
  try {
    const { product_id, user_id, rating, comment } = req.body;

    // Проверка, что отзыв от этого пользователя на этот товар уже существует
    const existingReview = await Review.findOne({ product_id, user_id });
    if (existingReview) {
      return res.status(400).json({ message: "Вы уже оставили отзыв для этого товара" });
    }

    const newReview = await Review.create({
      product_id,
      user_id,
      rating,
      comment,
    });

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    const totalRatings = product.ratings_count || 0;
    const currentAvg = product.average_rating || 0;

    const newCount = totalRatings + 1;
    const newAvg = ((currentAvg * totalRatings + rating) / newCount).toFixed(2);

    product.ratings_count = newCount;
    product.average_rating = parseFloat(newAvg);

    await product.save();

    res.status(201).json({ message: "Отзыв добавлен", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при добавлении отзыва", error });
  }
});


// 🔹 Все пользователи
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении пользователей", error });
  }
});

// 🔹 Один пользователь
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении пользователя", error });
  }
});

// 🔹 Все заказы
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении заказов", error });
  }
});

// 🔹 Заказы конкретного пользователя
app.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении заказов пользователя", error });
  }
});

// 🔹 Создание нового заказа
app.post("/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при создании заказа", error });
  }
});

// 🔹 Авторизация в системе
app.post("/users/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    const user = await User.findOne({ login });

    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Неверный пароль" });
    }

    // Не возвращаем пароль
    res.json({
      _id: user._id,
      login: user.login,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// ===================== ЗАПУСК СЕРВЕРА =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});
