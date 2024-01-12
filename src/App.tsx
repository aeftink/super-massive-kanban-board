import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { Task } from "./Task";
import { atom, useAtom, PrimitiveAtom, useSetAtom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { Virtuoso } from "react-virtuoso";
import { useDroppable } from "@dnd-kit/core";
import { faker } from "@faker-js/faker";

enum TaskStatus {
  BACKLOG = "BACKLOG",
  TO_DO = "TO_DO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETE = "COMPLETE",
}

const TaskLabels: { [key: string]: string } = {
  [TaskStatus.BACKLOG]: "Backlog",
  [TaskStatus.TO_DO]: "To Do’s 🖋️",
  [TaskStatus.IN_PROGRESS]: "In Progress ✌️",
  [TaskStatus.COMPLETE]: "Completed 🎉",
};

export type Task = {
  id: string;
  title: string;
  genre: string;
  status: TaskStatus;
  num: number;
  first: string;
  last: string;
  likes: number;
  comments: number;
};

const containers = [
  TaskStatus.BACKLOG,
  TaskStatus.TO_DO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETE,
];

const genres = new Array(8)
  .fill(null)
  .map(() => faker.music.genre())
  .filter((value, index, arr) => arr.indexOf(value) === index);

// Dummy Data
function createRandomTask({ i, status }: { i: number; status: TaskStatus }) {
  return {
    id: crypto.randomUUID(),
    num: i + 1,
    title: faker.music.songName(),
    genre: genres[i % genres.length],
    status,
    first: faker.person.firstName(),
    last: faker.person.lastName(),
    likes: faker.number.int({ min: 0, max: 100 }),
    comments: faker.number.int({ min: 0, max: 100 }),
  };
}
const tasks = new Array(100_000)
  .fill(null)
  .map((_, i) => createRandomTask({ i, status: TaskStatus.BACKLOG }));

// Atoms
const tasksAtom = atomWithImmer<Task[]>(tasks);
const filterAtom = atom("all");
const filteredAtom = atom<Task[]>((get) => {
  const filter = get(filterAtom);
  const tasks = get(tasksAtom);
  if (filter === "all") return tasks;
  return tasks.filter((task) => task.genre === filter);
});
const addTaskAtom = atom(null, (get, set, update) => {
  const tasks = get(tasksAtom);
  const task = createRandomTask({
    i: tasks.length + 1,
    status: update as TaskStatus,
  });
  set(tasksAtom, (prev) => [...prev, task]);
});

const taskStatusAtoms: { [key: string]: PrimitiveAtom<Task[]> } =
  containers.reduce((acc, curr) => {
    return {
      ...acc,
      [curr]: atom((get) => {
        const tasks = get(filteredAtom);
        return tasks.filter((task) => task.status === curr);
      }),
    };
  }, {});

// Droppable container for tasks
function TasksGroups({ taskStatus }: { taskStatus: string }) {
  const [status] = useAtom(taskStatusAtoms[taskStatus]);
  const addTask = useSetAtom(addTaskAtom);
  const { isOver, setNodeRef } = useDroppable({
    id: taskStatus,
  });
  const style = {
    color: isOver ? "green" : undefined,
    height: "100%",
    width: "100%",
    backgroundColor: isOver ? "#CBD5E1" : "inherit",
  };

  const handleAdd = useCallback(() => {
    addTask(taskStatus);
  }, [addTask, taskStatus]);

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="grow font-semibold text-slate-800 dark:text-slate-100 truncate">
          {TaskLabels[taskStatus]}
        </h2>
        <button
          onClick={handleAdd}
          className="shrink-0 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 ml-2"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
            <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
          </svg>
        </button>
      </div>
      <Virtuoso
        // @ts-expect-error ref typing
        scrollerRef={setNodeRef}
        totalCount={status.length}
        itemContent={(index) => {
          const task = status[index];
          return <Task {...task} />;
        }}
        style={style}
      />
    </div>
  );
}

function App() {
  const [filter, set] = useAtom(filterAtom);
  const [tasks, updateTasks] = useAtom(tasksAtom);
  const addTask = useSetAtom(addTaskAtom);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return tasks.find((t) => t.id === activeId);
  }, [tasks, activeId]);

  const handleDragEnd = useCallback(
    function (event: DragEndEvent) {
      setActiveId(null);
      if (!event?.over) return;
      const { active, over } = event;
      updateTasks((draft) => {
        const task = draft.find(({ id }) => id === active.id);
        if (task) {
          task.status = over.id as TaskStatus;
        }
      });
    },
    [updateTasks]
  );

  const handleDragStart = useCallback(
    function (event: DragStartEvent) {
      setActiveId(event.active.id as string);
    },
    [setActiveId]
  );

  const handleAddRandom = useCallback(
    function () {
      addTask(containers[Math.floor(Math.random() * containers.length)]);
    },
    [addTask]
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto h-full">
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                  Super Massive Kanban Board ✨
                </h1>
                <h2>
                  {`100k movable, filterable cards `}
                  <span className="text-sm">
                    (
                    <a
                      href="https://github.com/aeftink/super-massive-kanban-board"
                      target="_blank"
                      className="text-blue-500 hover:text-blue-400"
                    >
                      view source
                    </a>
                    )
                  </span>
                </h2>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Add board button */}
                <button
                  onClick={handleAddRandom}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <svg
                    className="w-4 h-4 fill-current opacity-50 shrink-0"
                    viewBox="0 0 16 16"
                  >
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="ml-2">Add Random</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 border-b border-slate-200 dark:border-slate-700">
              <ul className="text-sm font-medium flex flex-nowrap -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-scroll no-scrollbar">
                <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                  <a
                    onClick={() => set("all")}
                    className={`${
                      filter === "all"
                        ? "text-indigo-500"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    } whitespace-nowrap cursor-pointer`}
                  >
                    View All
                  </a>
                </li>
                {genres.map((genre) => {
                  return (
                    <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                      <a
                        onClick={() => set(genre)}
                        className={`${
                          filter === genre
                            ? "text-indigo-500"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        } whitespace-nowrap cursor-pointer`}
                      >
                        {genre}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-12 gap-x-4 gap-y-8 h-full">
                {containers.map((status) => (
                  <TasksGroups key={status} taskStatus={status} />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? <Task {...activeTask} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
