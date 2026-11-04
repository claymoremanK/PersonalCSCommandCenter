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




const tasksCompleted = document.getElementById("taskCount");
const tasksTotal = document.getElementById("taskTotal");




renderTasks();

updateTaskCounter();


function renderTasks(){
    ListTask.innerHTML = "";

    for(let i = 0; i < tasks.length; i++){
    const item = document.createElement("li");
    item.classList.add("bg-gray-800", "flex", "flex-row", "gap-2", "rounded-2xl", "shadow-2xl", "p-4", "m-2", "justify-between");
    const label = document.createElement("label");
    label.classList.add("font-mono", "font-semibold", "text-lg")
    const cBox = document.createElement("input");
    const delButton = document.createElement("button");
    delButton.classList.add("bg-red-500", "rounded-md", "p-2", "m-2", "hover:bg-red-700");

    cBox.type = "checkbox";
    delButton.type = "button";
    delButton.id = `delButton-${tasks[i].id}`
    cBox.id = `task-${tasks[i].id}`
    cBox.checked = tasks[i].completed;

    delButton.textContent = "Delete"
    
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

    delButton.addEventListener("click", function(){
        const taskId = parseInt(delButton.id.replace("delButton-", ""));


         const index = tasks.findIndex(function(task){
            return task.id === taskId;
        })

        if(index !== -1){
            tasks.splice(index, 1);
            renderTasks();
            updateTaskCounter();
            console.log(tasks)
        }
        





        
    })





    item.appendChild(cBox);
    item.appendChild(label);
    item.appendChild(delButton);
    

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
        const TaskIds = tasks.map(function(task){
    return task.id;
})
        const lastTaskId = Math.max(0, ...TaskIds);
        const newTaskId = lastTaskId + 1;
        tasks.push({id: newTaskId, title: newTask, completed: false})
        console.log(tasks)
        renderTasks();
        updateTaskCounter();
        taskInput.value = "";
        
        

    
    }


}

taskForm.addEventListener("submit", taskFormSubmit);