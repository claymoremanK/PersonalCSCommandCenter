const tasks = [
    {
        id: 1,
        title: "Make one interaction work.",
        completed: true
    },
    {
        id: 2,
        title: "Create Basic Page Structure.",
        completed: true
    },
    {
        id: 3,
        title: "Add project/task date.",
        completed: false
    },
]

const ListTask = document.getElementById("taskList");
const taskForm = document.getElementById("addTaskForm");
const taskInput = document.getElementById("taskName");
const addButton = document.getElementById("newTaskButton");
let newTaskId = 4;



const tasksCompleted = document.getElementById("taskCount");
const tasksTotal = document.getElementById("taskTotal");




renderTasks();

updateTaskCounter();


function renderTasks(){
    ListTask.innerHTML = "";

    for(let i = 0; i < tasks.length; i++){
    const item = document.createElement("li");
    item.classList.add("bg-gray-800", "flex", "flex-row", "gap-2", "rounded-2xl", "shadow-2xl", "p-4", "m-2");
    const label = document.createElement("label");
    label.classList.add("font-mono", "font-semibold", "text-lg")
    const cBox = document.createElement("input");

    cBox.type = "checkbox";
    cBox.id = `task-${tasks[i].id}`
    cBox.checked = tasks[i].completed;
    
    label.textContent = tasks[i].title
    label.htmlFor = cBox.id;

        cBox.addEventListener("change", function(){

        const taskId = parseInt(cBox.id.replace("task-", ""));

        const task = tasks.find(function(task){
            return task.id === taskId;
        })

        task.completed = cBox.checked;

        updateTaskCounter();
    


        
    })



    item.appendChild(cBox);
    item.appendChild(label)
    

    ListTask.appendChild(item);
}
}




function updateTaskCounter (){
   let numberofCompletedTasks = 0;
    
    for(let i = 0; i < tasks.length; i++){
        if(tasks[i].completed === true){
            

            
            numberofCompletedTasks++;


            
        }
    }

    tasksCompleted.textContent = numberofCompletedTasks;
    tasksTotal.textContent = tasks.length
}

function taskFormSubmit(event){
    const newTask = taskInput.value.trim();
    event.preventDefault();

    if(newTask === ""){
        alert("Please provide a title for the task")
        return;
        
    } else{
        tasks.push({id: newTaskId, title: newTask, completed: false})
        console.log(tasks)
        renderTasks();
        updateTaskCounter();
    
    }

    newTaskId++;

}

taskForm.addEventListener("submit", taskFormSubmit);