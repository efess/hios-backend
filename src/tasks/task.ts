interface Task {
    timing: string;
    time: number;
    fn: (context: any) => any;
    fnContext: any;
}

interface RunningTask {
    task: Task;
    timerId: ReturnType<typeof setTimeout>;
}

const currentTasks: Task[] = [];
const runningTasks: RunningTask[] = [];

function addTask(task: Task): void {
    currentTasks.push(task);
}

function execIntervalTask(runningTask: RunningTask): void {
    const task = runningTask.task;
    runningTask.timerId = setTimeout(function () {
        const next = execIntervalTask.bind(null, runningTask);
        const p = task.fn(task.fnContext);

        if (p && p.then) {
            p.then(next, next);
        } else {
            next();
        }
    }, task.time);
}

function startTask(task: Task): void {
    const runningTask: RunningTask = {
        task: task,
        timerId: setTimeout(() => {}, 0)
    };

    if (task.timing === 'interval') {
        execIntervalTask(runningTask);
        task.fn(task.fnContext);
    }
    runningTasks.push(runningTask);
}

function startAll(): void {
    currentTasks.forEach(startTask);
}

export default {
    addTask: addTask,
    startAll: startAll
};
