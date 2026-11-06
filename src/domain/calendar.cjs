// /src/domain/calendar.cjs
'use strict';
const DAY=86400000;
function parseDay(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const[y,m,d]=value.split('-').map(Number);if(y<1||m<1||m>12||d<1||d>31)return null;const date=new Date(0);date.setUTCFullYear(y,m-1,d);date.setUTCHours(12,0,0,0);return date.toISOString().slice(0,10)===value?date:null;}
function validDay(value){return parseDay(value)!==null;}
function validMonth(value){return typeof value==='string'&&/^\d{4}-\d{2}$/.test(value)&&validDay(value+'-01');}
function shiftMonth(month,delta){if(!validMonth(month)||!Number.isInteger(delta))return month;const[y,m]=month.split('-').map(Number),next=Math.max(12,Math.min(9999*12+11,y*12+m-1+delta));return `${String(Math.floor(next/12)).padStart(4,'0')}-${String(next%12+1).padStart(2,'0')}`;}
// Monday-first, complete week rows. Out-of-domain edge cells are intentionally blank.
function monthCells(month){if(!validMonth(month))return[];const first=parseDay(month+'-01'),offset=(first.getUTCDay()+6)%7;return Array.from({length:42},(_,i)=>{const d=new Date(first.getTime()+(i-offset)*DAY),iso=d.toISOString().slice(0,10);return validDay(iso)?{iso,day:d.getUTCDate(),inMonth:iso.slice(0,7)===month}:null;});}
function toggleDate(list,date){if(!validDay(date))return list;const values=new Set((Array.isArray(list)?list:[]).filter(validDay));if(values.has(date))values.delete(date);else values.add(date);return[...values].sort();}
module.exports={parseDay,validDay,validMonth,shiftMonth,monthCells,toggleDate};
