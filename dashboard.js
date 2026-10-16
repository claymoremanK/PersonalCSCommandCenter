const taskCheck = document.querySelectorAll('input[type="checkbox"]');
const totalTasks = document.getElementById("taskTotal");
const countcheckedTasks = document.getElementById("taskCount")
console.log(taskCheck)

totalTasks.textContent = taskCheck.length



countCompletedTasks();

function countCompletedTasks(){
    let completedTask = 0;

for(let i = 0; i < taskCheck.length; i++){
    if(taskCheck[i].checked){
        completedTask++;

    }
}
console.log(completedTask);
countcheckedTasks.textContent = completedTask;
}



for(let i = 0; i < taskCheck.length; i++){
    taskCheck[i].addEventListener("change", function (){
        console.log("The checkbox changed!")
        countCompletedTasks();
        
    })
}
