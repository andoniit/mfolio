'use client';
import React from 'react'
import styles from './style.module.css';

export default function index({index, title, description, href, setModal}) {

    return (
            <div 
            onMouseEnter={() => setModal({ active: true, index })} 
            onMouseLeave={() => setModal({ active: false, index })}
            onClick={() => {
              window.location.href = href;
            }}
            className={styles.project}>
            
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}
