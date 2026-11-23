    const defaultTasks = [
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


    const tasks = JSON.parse(localStorage.getItem("myTasks")) || defaultTasks;



    const ListTask = document.getElementById("taskList");
    const taskForm = document.getElementById("addTaskForm");
    const taskInput = document.getElementById("taskName");
    const addButton = document.getElementById("newTaskButton");




    const tasksCompleted = document.getElementById("taskCount");
    const tasksTotal = document.getElementById("taskTotal");




    renderTasks();

    updateTaskCounter();

    function saveTasksToLocalStorage() {
        localStorage.setItem("myTasks", JSON.stringify(tasks));
    }


    function renderTasks(){
        ListTask.innerHTML = "";

        for(let i = 0; i < tasks.length; i++){
        const item = document.createElement("li");
    item.classList.add(
        "bg-zinc-900",
        "border",
        "border-zinc-800",
        "rounded-xl",
        "px-4",
        "py-3",
        "flex",
        "items-center",
        "gap-3",
        "transition-colors",
        "hover:border-zinc-700"
    );
        const label = document.createElement("label");
        label.classList.add(
        "flex-1",
        "text-sm",
        "font-medium",
        "text-slate-200",
        "cursor-pointer",
        "break-words"
    );
        const cBox = document.createElement("input");
        cBox.classList.add(
        "accent-violet-500",
        "w-4",
        "h-4",
        "shrink-0",
        "cursor-pointer"
    );
        const delButton = document.createElement("button");
    delButton.classList.add(
        "text-sm",
        "text-slate-500",
        "hover:text-red-400",
        "transition-colors",
        "px-2",
        "py-1",
        "rounded-md",
        "shrink-0"
    );

        cBox.type = "checkbox";
        delButton.type = "button";
        delButton.id = `delButton-${tasks[i].id}`
        cBox.id = `task-${tasks[i].id}`
        cBox.checked = tasks[i].completed;

        delButton.textContent = "Delete"
        
        label.textContent = tasks[i].title
        label.htmlFor = cBox.id;
        if (tasks[i].completed === true) {
    label.classList.add("line-through", "text-slate-500");
}

            cBox.addEventListener("change", function(){

            const taskId = parseInt(cBox.id.replace("task-", ""));

            const task = tasks.find(function(task){
                return task.id === taskId;
            })

            task.completed = cBox.checked;


            updateTaskCounter();
            saveTasksToLocalStorage();
            renderTasks();
            
        


            
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
                saveTasksToLocalStorage();
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
            saveTasksToLocalStorage();
            taskInput.value = "";
            
            

        
        }


    }

    taskForm.addEventListener("submit", taskFormSubmit);

