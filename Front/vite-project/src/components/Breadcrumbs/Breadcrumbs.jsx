import React from "react";
import { Link } from "react-router-dom";
import style from "./Breadcrumbs.module.css";

export default function Breadcrumbs({ items }) {
  return (
    <div className={style.breadcrumbs}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link to={item.href} className={style.link}>
              {item.label}
            </Link>
          ) : (
            <span className={style.current}>{item.label}</span>
          )}

          {index < items.length - 1 && (
            <span className={style.separator}>/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}