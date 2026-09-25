import React from "react";
import CheckoutView from "../../Checkout/components/CheckoutView.jsx";

export default function CartContainer({ cart = [], onBackToShop }) {
  return <CheckoutView onBackToCart={onBackToShop} />;
}