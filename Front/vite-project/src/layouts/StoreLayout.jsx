import React from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export default function StoreLayout({ children }) {
  return (
    <div className="app">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}