const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://mk-diploma-natalina-app.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

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
const ReviewSchema = new mongoose.Schema(
  {
    product_id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
    status: {
      type: String,
      enum: ["на проверке", "опубликован"],
      default: "на проверке",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Review = mongoose.model("Review", ReviewSchema, "Reviews");

// ✅ Пользователи
const UserSchema = new mongoose.Schema(
  {
    password_hash: String,
    name: String,
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: "user", // ← по умолчанию
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const User = mongoose.model("User", UserSchema, "Users");

// ✅ Заказы
const OrderSchema = new mongoose.Schema(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    consultant_id: String,
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
  },
  { versionKey: false }
);

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

    const reviews = await Review.find({
      user_id: new mongoose.Types.ObjectId(userId),
    });
    res.json(reviews);
  } catch (error) {
    console.error("Ошибка при получении отзывов пользователя:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении отзывов пользователя", error });
  }
});

// 🔹 Добавить отзыв и обновить рейтинг
app.post("/reviews", async (req, res) => {
  try {
    const { product_id, user_id, rating, comment } = req.body;

    const existingReview = await Review.findOne({ product_id, user_id });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Вы уже оставили отзыв для этого товара" });
    }

    const newReview = await Review.create({
      product_id,
      user_id,
      rating,
      comment,
      status: "на проверке",
    });

    res.status(201).json({ message: "Отзыв добавлен и ожидает модерации", review: newReview });
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
    res
      .status(500)
      .json({ message: "Ошибка при получении пользователей", error });
  }
});

// 🔹 Один пользователь
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при получении пользователя", error });
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
    res
      .status(500)
      .json({ message: "Ошибка при получении заказов пользователя", error });
  }
});

// 🔹 Создание нового заказа
app.post("/orders", async (req, res) => {
  try {
    let userId = null;

    // Если есть phone — ищем пользователя с таким номером
    if (req.body.phone) {
      const existingUser = await User.findOne({ phone: req.body.phone });
      if (existingUser) {
        userId = existingUser._id;
      }
    }

    const order = await Order.create({
      ...req.body,
      user_id: userId, // ← либо найденный, либо null
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при создании заказа", error });
  }
});

// 🔹 Авторизация в системе
app.post("/users/login", async (req, res) => {
  const { phone, password } = req.body;

  try {
    const cleanPhone = "+7" + phone.replace(/\D/g, "").slice(-10);

    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Пользователь с таким номером не найден" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Неверный пароль" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// 🔹 Пользователи по номеру телефона
app.get("/users/phone/:phone", async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      return res.status(404).json({ exists: false });
    }
    res.json({ exists: true, name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при поиске пользователя", error });
  }
});

// 🔹 Проверка соответствия имени и номера
app.post("/users/check-phone", async (req, res) => {
  let { phone, name } = req.body;

  // 🔧 Приведение телефона к формату +7XXXXXXXXXX
  phone = "+7" + phone.replace(/\D/g, "").slice(-10);

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.json({ exists: false });
    }

    const isNameMatch =
      user.name.trim().toLowerCase() === name.trim().toLowerCase();

    if (!isNameMatch) {
      return res.status(409).json({
        message:
          "Номер телефона уже зарегистрирован с другим именем. Пожалуйста, авторизуйтесь.",
      });
    }

    res.json({ exists: true, matched: true });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при проверке номера", error });
  }
});

// 🔹 Создание нового пользователя
app.post("/users", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Пользователь с таким номером уже существует" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, phone, role, password_hash });
    res.status(201).json(newUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при создании пользователя", error });
  }
});

// 🔹 Обновление пользователя
app.put("/users/:userId", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    const updateData = { name, phone, role };
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при обновлении пользователя", error });
  }
});

// 🔹 Удаление пользователя
app.delete("/users/:userId", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json({ message: "Пользователь удалён" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при удалении пользователя", error });
  }
});

// 🔹 Обновление заказа
app.put("/orders/:id", async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Заказ не найден" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении заказа", error });
  }
});

// 🔹 Добавление отзыва
app.put("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Отзыв не найден" });

    const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Если статус изменился на "опубликован", пересчитываем рейтинг
    if (req.body.status === "опубликован") {
      const approvedReviews = await Review.find({
        product_id: review.product_id,
        status: "опубликован",
      });

      const ratings = approvedReviews.map(r => r.rating);
      const average = ratings.reduce((acc, r) => acc + r, 0) / ratings.length;

      await Product.findByIdAndUpdate(review.product_id, {
        average_rating: parseFloat(average.toFixed(2)),
        ratings_count: ratings.length,
      });
    }

    res.json({ message: "Отзыв обновлён", review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении отзыва", error });
  }
});

// 🔹 Удаление отзыва
app.delete("/reviews/:id", async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Отзыв не найден" });
    res.json({ message: "Отзыв удалён" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении отзыва", error });
  }
});

// ===================== ЗАПУСК СЕРВЕРА =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});
