import React from 'react';
import design from './design.cjs';

// Browser SVG uses DOM primitives; the native SVG component is kept in
// BrandMark.js for Android and iOS. This avoids the failing web adapter.
export default function BrandMark({size=36, color}) {
  const fill = color || design.colors.accent;
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 800 760',
    role: 'img',
    'aria-label': 'Niyarvo symbol',
    focusable: 'false',
    style: {display:'block', flexShrink:0},
  },
    React.createElement('path', {key: 'path-0', d: 'M 71 653 L 71 379 C 70 321 93 291 151 274 C 176 267 201 268 233 276 C 219 310 215 350 216 410 L 216 478 C 216 563 171 610 71 653 Z', fill, opacity:0.93}),
    React.createElement('path', {key: 'path-1', d: 'M 579 221 C 583 165 639 125 728 112 L 728 492 C 728 581 697 618 627 627 C 625 550 618 462 601 384 C 584 316 573 271 579 221 Z', fill, opacity:0.93}),
    React.createElement('path', {key: 'path-2', d: 'M 294 331 C 354 366 374 443 418 502 C 475 579 570 610 627 704 C 627 580 573 505 505 455 C 429 405 359 368 294 331 Z', fill, opacity:0.93}),
    React.createElement('path', {key: 'path-3', d: 'M 143 51 L 397 205 C 544 295 613 417 627 704 C 592 605 540 535 446 475 C 392 440 321 405 256 352 C 171 283 140 183 143 51 Z', fill})
  );
}
