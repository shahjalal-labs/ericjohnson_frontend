import { StaticImageData } from "next/image"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string | StaticImageData
  rating: number
  category: string
  brand: string
  unit: string
}

export interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: {
    min: number
    max: number
  }
  ratings: number[]
  sortBy: string
}

export interface Category {
  id: string
  name: string
  count?: number
}

export interface Brand {
  id: string
  name: string
  count?: number
}
