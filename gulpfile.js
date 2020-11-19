'use strict';

const FilesJS = [
    // 'app/js/canvas.js',
    'app/js/main-script.js'
];

// Подключение модулей
const {src, dest, parallel, series, watch} = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del'); //модуль удаления файлов
const concat = require('gulp-concat');
const terserJS = require('gulp-terser'); // как uglifyES, по рекомендации gulp
const rename = require('gulp-rename');
const scss = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const tinypng = require('gulp-tinypng-compress');
const newer = require('gulp-newer');
// npm list --depth=0 // показать установленные пакеты

function browser_sync() {
    browserSync.init({
        server: { //запуск локального сервера
            baseDir: "app/",
        },
        notify: false,
        // online: false,
        // port: 3000,
    })
}
function processScripts() {
    return src([
            'app/js/main-script.js'
        ])
        .pipe(concat('main-script-min.js'))
        // .pipe(rename({
        //     suffix: "-min",
        // }))
        .pipe(terserJS({
            // toplevel: true //сильное сжатие, замена имён функций, методов и тд
        }))
        .pipe(dest('app/js/min/'))
        .pipe(browserSync.stream())
}
/* 
Обрабатывает главный scss файл и парсит его в css, сторонние стили подключаются либо в html, либо импортируются
в главный scss файл
*/
function processStyles() {
    return src('app/scss/main-style.scss')
        .pipe(sourcemaps.init())
        .pipe(scss({
            outputStyle: 'expanded'
        }).on('error', notify.onError()))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true,
            cascade: false
        }))
        .pipe(dest('app/css/')) // Выгрузка не сжатых стилей
        .pipe(cleancss({
            level: 2
        }))
        .pipe(rename({
            suffix: "-min",
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('app/css/min/')) // Выгрузка сжатых стилей для подключения
        .pipe(browserSync.stream())
}
/*
Функция для минификации стилей, вызывать отдельно: gulp process_single_file_css
Её можно применять в том случае, когда нужно минифицировать какой-нибудь css файл библиотек
и после этого больше не трогать эти файлы, просто чтобы не искать всякие онлайн сервисы для минификации
*/
function processSingleFileCSS() {
    return src('app/css/my_normalize.css')
        .pipe(cleancss({
            level: 2
        }))
        .pipe(rename({
            suffix: "-min",
        }))
        .pipe(dest('app/css/min/'))
}

/*
Функция сжимает графику, и перемещает её в соответствующую папку,
форматы которые не нужно сжимать, просто переносит, можно указать какие именно
форматы графики будут просто переноситься
*/
function compressImagesTinyPNG() {
    return src(['app/img/not-optimized/**/*.{png,jpg,jpeg}'])
    .pipe(newer('app/img/optimize')) // не оптимизируем ранее сжатые изображения
    .pipe(tinypng({
        key: 'nTMQt799Y8K9hgy89bhMC1LZPln4g57t',
        log: true
    }))
    .pipe(dest('app/img/optimize'))
    // svg, gif и webp просто переносим
    .pipe(src('app/img/not-optimized/**/*.{svg,webp,gif,ico}'))
    .pipe(dest('app/img/optimize'))
}
// Не вызывается в default, просто для удаления папки изображения
function cleanImg() {
    return del('app/img/optimize/**')
}
// Очищает папку сборки проекта
function cleanDist() {
    return del('dist/**')
}

function startWatch() {
    watch(['app/scss/**'], processStyles); // наблюдение за scss
    watch(['app/js/**/*.js', '!app/js/min/**'], processScripts); // наблюдение за js
    watch('app/**/*.html').on('change', browserSync.reload); // наблюдение за html в любых папках проекта
    watch('app/img/not-optimized/**', compressImagesTinyPNG); // наблюдаем img
}
// Собирает проект и копирует в папку dist
function buildCopy() {
    return src([
        'app/**', // Копируем всё кроме...
        '!./app/scss/**', // scss
        '!./app/img/not-optimized/**' // не сжатой графики

    ], {base: 'app'})
    .pipe(dest('dist/'))
}

exports.browser_sync = browser_sync;
exports.process_scripts = processScripts;
exports.process_styles = processStyles;
exports.process_single_file_css = processSingleFileCSS;
exports.compress_images_tiny_png = compressImagesTinyPNG;
exports.clean_img = cleanImg;

exports.build = series(cleanDist, processStyles, processScripts, cleanImg, compressImagesTinyPNG, buildCopy);

exports.default = parallel(processStyles, processScripts, compressImagesTinyPNG, browser_sync, startWatch);
