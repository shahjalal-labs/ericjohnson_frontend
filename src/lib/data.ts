import headphone from "@/assets/home/products/headphone.jpg"
import watch from "@/assets/home/products/watch.jpg"
import top from "@/assets/home/products/top.jpg"
import penpaper from "@/assets/home/products/penpaper.jpg"
import sticky from "@/assets/home/products/sticky.jpg"
import anotherHeadphone from "@/assets/home/products/anotherHeadphone.jpg"
import headPho from "@/assets/home/products/headPh.jpg"
export const sampleProducts = [
  {
    id: "1",
    name: "Headphones",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: headphone,
    imageAlt: "Black headphones on yellow background",
    category: "electronics",
  },
  {
    id: "2",
    name: "Headphones",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: anotherHeadphone,
    imageAlt: "Purple wireless headphones on brown background",
    category: "electronics",
  },
  {
    id: "3",
    name: "Headphones",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: headPho,
    imageAlt: "Orange and black headphones on pink background",
    category: "electronics",
  },
  {
    id: "4",
    name: "Best Watch 2025",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: watch,
    imageAlt: "Luxury silver watch with blue dial",
    category: "electronics",
  },
  {
    id: "5",
    name: "Lunch container",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: top,
    imageAlt: "White lunch containers with wooden utensils",
    category: "cup",
  },
  {
    id: "6",
    name: "Pens & Paper",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: penpaper,
    imageAlt: "Pens and paper on grid background",
    category: "bag",
  },
  {
    id: "7",
    name: "Sticky Note",
    price: 59.0,
    rating: 4,
    reviewCount: 40,
    description:
      "Experience the best of online shopping with premium quality, fast delivery, and secure payments. Exclusive 20% off this weekend!",
    image: sticky,
    imageAlt: "Colorful sticky notes stack",
    category: "bag",
  },
]



export const categoriesProducts = sampleProducts.slice(0, 6)
export const bestSellingProducts = sampleProducts.slice(0, 6)
export const newArrivalsProducts = sampleProducts.slice(0, 6)
