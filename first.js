//COUNTER PROGRAM

const increasesBTN = document.getElementById("increasesBTN");
const decreasesBTN = document.getElementById("decreasesBTN");
const resetBTN = document.getElementById("resetBTN");
const Counter=document.getElementById("Counter");

let count=0;

increasesBTN.onclick=function(){
    count++;
    Counter.textContent=count;
}
decreasesBTN.onclick=function(){
    count--;
    Counter.textContent=count;
}
resetBTN.onclick=function(){
    count=0;
    Counter.textContent=count;
}
// This is a simple counter program that allows the user to increase, decrease, or reset the count.

