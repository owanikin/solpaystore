import React from "react";
import styles from "../styles/Product.module.css";
import Buy from "./Buy";
import IPFSDownload from "./IpfsDownload";

export default function Product({ product }) {
    const { id, name, price, description, image_url } = product;

    return (
        <div className={styles.product_container}>
            <div>
                <img src={image_url} alt={name} className={styles.product_image} />
            </div>
            <div className={styles.product_details}>
                <div className={styles.product_text}>
                    <div className={styles.product_title}>{name}</div>
                    <div className={styles.product_description}>{description}</div>
                </div>

                <div className={styles.product_action}>
                    <div className={styles.product_price}>{price} USDC</div>
                    {/* We are hardcoding this for now, we'll fetch the hash from the API later */}
                    <IPFSDownload filename="emojis.zip" hash="QmWWH69mTL66r3H8P4wUn24t1L5pvdTJGUTKBqT11KCHS5" cta="Download emojis" />
                    <Buy itemID={id} />
                </div>
            </div>
        </div>
    )
}