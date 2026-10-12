import { Product } from "../types/product"
import product1 from "@/assets/products/filterProduct/Rectangle 8 (18).png"
import product2 from "@/assets/products/filterProduct/Rectangle 8 (19).png"
import product3 from "@/assets/products/filterProduct/Rectangle 8 (20).png"
import product4 from "@/assets/products/filterProduct/Rectangle 8 (21).png"
import product5 from "@/assets/products/filterProduct/Rectangle 8 (22).png"
// import product6 from "@/assets/products/filterProduct/Rectangle 8 (23).png"
import product6 from "@/assets/products/filterProduct/Rectangle 8 (24).png"
// import product8 from "@/assets/products/filterProduct/Rectangle 8 (2).png"
export const products: Product[] = [
  {
    id: "1",
    name: "Frozen Broccoli",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 10.0,
    image: product1,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
  {
    id: "2",
    name: "Frozen Green Beans",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 20.0,
    image: product2,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
  {
    id: "3",
    name: "Frozen Spinach",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 20.0,
    image: product3,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
  {
    id: "4",
    name: "Frozen Corn",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 10.0,
    image: product4,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
  {
    id: "5",
    name: "Frozen Carrots",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 20.0,
    image: product5,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
  {
    id: "6",
    name: "Frozen Strawberries",
    description: "Rich in vitamin C and antioxidants for a healthy boost.",
    price: 20.0,
    image: product6,
    rating: 4.5,
    category: "Frozen Food's",
    brand: "Food's",
    unit: "kg",
  },
]

export const categories = [
  { id: "frozen-foods", name: "Frozen Food's" },
  { id: "coffee", name: "Coffee" },
  { id: "juices", name: "Juices" },
  { id: "soups", name: "Soups" },
  { id: "noodles", name: "Noodles" },
  { id: "frozen-fish", name: "Frozen Fish" },
  { id: "frozen-meats", name: "Frozen Meats" },
  { id: "processed-foods", name: "Processed Foods" },
  { id: "beer", name: "Beer" },
  { id: "tea-beverages", name: "Tea & Beverages" },
  { id: "fukahire", name: "Fukahire" },
  { id: "flour", name: "Flour" },
  { id: "dried-fruits", name: "Dried fruits & Fresh Fruits" },
  { id: "lentils", name: "Lentils" },
  { id: "spices", name: "Spices" },
  { id: "preserved-foods", name: "Preserved foods" },
]

export const brands = [
  { id: "frostbites", name: "Frostbite's" },
  { id: "chill-eats", name: "Chill eats" },
  { id: "arctic-meats", name: "Arctic meats" },
]
