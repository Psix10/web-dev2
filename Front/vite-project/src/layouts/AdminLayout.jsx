import React from "react";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";
import style from "./AdminLayout.module.css";

export default function AdminLayout({ title, children }) {
  return (
    <div className={style.adminLayout}>
      <AdminSidebar />

      <div className={style.contentArea}>
        <header className={style.topbar}>
          <h2 className={style.pageTitle}>{title}</h2>
        </header>

        <main className={style.mainContent}>{children}</main>
      </div>
    </div>
  );
}