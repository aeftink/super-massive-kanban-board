import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { TasksGroups } from "./TasksGroups";
import { Task } from "./Task";
import { atom, useAtom, PrimitiveAtom, useSetAtom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { Virtuoso } from "react-virtuoso";
import { useDroppable } from "@dnd-kit/core";

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

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
};

const containers = [
  TaskStatus.BACKLOG,
  TaskStatus.TO_DO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETE,
];

const tasks = new Array(1000).fill(null).map((_, i) => ({
  id: crypto.randomUUID(),
  title: `Task ${i}`,
  status: TaskStatus.BACKLOG,
}));

const tasksAtom = atomWithImmer<Task[]>(tasks);

const taskStatusAtoms: { [key: string]: PrimitiveAtom<Task[]> } =
  containers.reduce((acc, curr) => {
    return {
      ...acc,
      [curr]: atom((get) => {
        const tasks = get(tasksAtom);
        return tasks.filter((task) => task.status === curr);
      }),
    };
  }, {});

function App() {
  const [tasks, updateTasks] = useAtom(tasksAtom);
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

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto h-full">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-12 gap-x-4 gap-y-8 h-full">
                {containers.map((status) => (
                  <TasksGroupsVirtuoso key={status} taskStatus={status} />
                  // <ContainerGroup key={status} taskStatus={status} />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? (
                  <Task id={activeTask.id} title={activeTask.title} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

export function TasksGroupsVirtuoso({ taskStatus }: { taskStatus: string }) {
  const [status] = useAtom(taskStatusAtoms[taskStatus]);
  const { isOver, setNodeRef } = useDroppable({
    id: taskStatus,
  });
  const style = {
    color: isOver ? "green" : undefined,
    height: "100%",
    width: "100%",
  };

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="grow font-semibold text-slate-800 dark:text-slate-100 truncate">
          {TaskLabels[taskStatus]}
        </h2>
        <button className="shrink-0 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 ml-2">
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
          return <Task id={task.id} title={task.title} />;
        }}
        style={style}
      />
    </div>
  );
}
