'use strict';


export function counterArr() {
    for (let i = 0; i < 10; i++) {
        console.warn(i);
    }
}

export function transImg() {
    let img = document.querySelector('.img-test1');
    img.style.transform = 'translateX(50px)';
    throw new Error('HAHAHA');
}

export function sayHi() {
    console.warn('object');
    alert('Hello');
}