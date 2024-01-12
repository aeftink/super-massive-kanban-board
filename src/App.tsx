import React, { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
// import { DragDropContext } from "@hello-pangea/dnd";
// import type { DropResult } from "@hello-pangea/dnd";
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

const TaskLabels = {
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

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

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
  const [activeId, setActiveId] = useState(null);
  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return tasks.find((t) => t.id === activeId);
  }, [tasks, activeId]);

  const handleDragEnd = useCallback(
    function (event: DragEndEvent) {
      // if (!event?.destination || !event?.source) return;
      // if (event.source.index === event.destination.index) {
      //   return;
      // }

      // const { draggableId, destination } = event;
      // console.log("event", event);

      setActiveId(null);
      if (!event?.over) return;
      const { active, over } = event;
      // const taskId = parseInt(active.id as string);
      updateTasks((draft) => {
        const task = draft.find(({ id }) => id === active.id);
        if (task) {
          task.status = over.id as TaskStatus;
        }
      });

      // updateTasks((draft) => {
      //   const task = draft.find((task) => task.id === draggableId);
      //   console.log("task", task?.id, draggableId, destination.droppableId);
      //   if (!task) return;
      //   task.status = destination.droppableId as TaskStatus;
      // });
    },
    [updateTasks]
  );

  const handleDragStart = useCallback(
    function (event: DragStartEvent) {
      setActiveId(event.active.id);
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

function ContainerGroup({ taskStatus }: { taskStatus: TaskStatus }) {
  const [status] = useAtom(taskStatusAtoms[taskStatus]);
  // console.log("stat", taskStatus, status);

  return (
    <TasksGroups
      key={taskStatus}
      id={taskStatus}
      title={TaskLabels[taskStatus]}
    >
      {status.length === 0 && "Drop here"}
      {status.map((task, i) => (
        <TaskAtom key={task.id} task={task} index={i} />
      ))}
    </TasksGroups>
  );
}

function TaskAtom({ task, index }: { task: Task; index: number }) {
  const { id, title } = task;
  // console.log("task item rendering", id);
  return <Task id={id} title={title} />;
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
    <>
      <Virtuoso
        scrollerRef={setNodeRef}
        totalCount={status.length}
        itemContent={(index) => {
          const task = status[index];
          return <Task id={task.id} title={task.title} />;
        }}
        style={style}
        className="col-span-full sm:col-span-6 xl:col-span-3"
      />
    </>
  );
}
