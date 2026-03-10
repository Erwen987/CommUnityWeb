/* DROPDOWN ACTIONS */

document.addEventListener("click", function(e){

const actionBtn = e.target.closest(".action-btn");

if(actionBtn){

const container = actionBtn.closest(".action");
const menu = container.querySelector(".dropdown-menu");

/* close other menus */

document.querySelectorAll(".dropdown-menu").forEach(m=>{
if(m !== menu){
m.classList.remove("active");
}
});

/* toggle current */

menu.classList.toggle("active");

e.stopPropagation();

return;
}

/* close menus when clicking outside */

if(!e.target.closest(".dropdown-menu")){
document.querySelectorAll(".dropdown-menu").forEach(menu=>{
menu.classList.remove("active");
});
}

});