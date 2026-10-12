import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected?: boolean;
  maxQuantity?: number;
}

interface CartState {
  items: CartItem[];
  totalQuantity: number; // Number of unique products
  totalAmount: number;
  totalItemsCount: number; // Total quantity of all items
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  totalItemsCount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, "quantity" | "selected"> & { maxQuantity?: number }>) => {
      const newItem = action.payload;
      const existingItem = state.items.find(item => item.id === newItem.id);

      if (existingItem) {
        // Check if we can add more quantity (strict equality check)
        if (existingItem.maxQuantity && existingItem.quantity >= existingItem.maxQuantity) {
          return; // Quantity limit reached, don't add more
        }
        
        // Increase quantity but don't increase totalQuantity (unique product count)
        existingItem.quantity += 1;
        state.totalItemsCount += 1;
        state.totalAmount += newItem.price;
      } else {
        // New product added
        state.items.push({
          ...newItem,
          quantity: 1,
          selected: true,
          maxQuantity: newItem.maxQuantity,
        });
        state.totalQuantity += 1;
        state.totalItemsCount += 1;
        state.totalAmount += newItem.price;
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const existingItem = state.items.find(item => item.id === id);

      if (existingItem) {
        state.totalQuantity -= 1;
        state.totalItemsCount -= existingItem.quantity;
        state.totalAmount -= existingItem.price * existingItem.quantity;
        state.items = state.items.filter(item => item.id !== id);
      }
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item) {
        // Strict equality check for max quantity
        if (item.maxQuantity && item.quantity >= item.maxQuantity) {
          return; // Don't increase beyond available quantity
        }
        item.quantity += 1;
        state.totalItemsCount += 1;
        state.totalAmount += item.price;
      }
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item && item.quantity > 1) {
        item.quantity -= 1;
        state.totalItemsCount -= 1;
        state.totalAmount -= item.price;
      }
    },

    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item) {
        item.selected = !item.selected;
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.totalItemsCount = 0;
    },

    // NEW: Clear only selected items from cart
    clearSelectedItems: (state) => {
      const selectedItems = state.items.filter(item => item.selected === true);
      
      if (selectedItems.length > 0) {
        // Calculate totals to subtract
        const removedQuantity = selectedItems.length;
        const removedItemsCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
        const removedAmount = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Remove selected items
        state.items = state.items.filter(item => item.selected !== true);
        
        // Update totals
        state.totalQuantity -= removedQuantity;
        state.totalItemsCount -= removedItemsCount;
        state.totalAmount -= removedAmount;
        
        // Ensure totals don't go negative
        state.totalQuantity = Math.max(0, state.totalQuantity);
        state.totalItemsCount = Math.max(0, state.totalItemsCount);
        state.totalAmount = Math.max(0, state.totalAmount);
      }
    },

    updateCartTotals: (state) => {
      state.totalQuantity = state.items.length;
      state.totalItemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  toggleItemSelection,
  clearCart,
  clearSelectedItems, // Export the new action
  updateCartTotals,
} = cartSlice.actions;

export default cartSlice.reducer;