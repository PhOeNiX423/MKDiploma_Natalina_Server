import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

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

let Product;

try {
  Product = mongoose.model("Product");
} catch {
  Product = mongoose.model("Product", ProductSchema, "Products");
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении товаров", error });
    }
  } else {
    res.status(405).json({ message: "Метод не разрешён" });
  }
}
