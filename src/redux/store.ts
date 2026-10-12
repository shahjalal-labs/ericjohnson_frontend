import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import baseApi from "./api/baseApi";

import cartReducer from "@/redux/allSlice/cartSlice";
import onboardingReducer from "@/redux/allSlice/onboardingSlice";
import { useDispatch, useSelector } from "react-redux";

// Persist configuration for cart
const cartConfig = {
  key: "cart",
  storage,
};

const persistCart = persistReducer(cartConfig, cartReducer);

export const store = configureStore({
  reducer: {
    cart: persistCart, 
    onboarding: onboardingReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["Auth.somePathWithNonSerializableValues"],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T,>(selector: (state: RootState) => T) =>
  useSelector<RootState, T>(selector);