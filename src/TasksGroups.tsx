import { useDroppable } from "@dnd-kit/core";
import { Droppable } from "@hello-pangea/dnd";
import React from "react";

export function TasksGroups({
  id,
  children,
  title,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  const style = {
    color: isOver ? "green" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="col-span-full sm:col-span-6 xl:col-span-3"
    >
      {/* Column header */}
      <header>
        <div className="flex items-center justify-between mb-2">
          <h2 className="grow font-semibold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </h2>
          <button className="shrink-0 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 ml-2">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
          </button>
        </div>
        {/* Cards */}
        <div className="grid gap-2">{children}</div>
      </header>
    </div>
  );
}

export function TasksGroups2({
  id,
  children,
  title,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  // const { isOver, setNodeRef } = useDroppable({
  //   id,
  // });
  // const style = {
  //   color: isOver ? "green" : undefined,
  // };

  return (
    <Droppable
      droppableId={id}
      // mode="virtual"
      //     renderClone={(provided, snapshot, rubric) => (
      //       <Item
      //         provided={provided}
      //         isDragging={snapshot.isDragging}
      //         item={items[rubric.source.index]}
      //       />
      //     )}
    >
      {(provided) => {
        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            // ref={setNodeRef}
            // style={style}
            className="col-span-full sm:col-span-6 xl:col-span-3"
          >
            {/* Column header */}
            <header>
              <div className="flex items-center justify-between mb-2">
                <h2 className="grow font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {title}
                </h2>
                <button className="shrink-0 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 ml-2">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                </button>
              </div>
              {/* Cards */}
              <div className="grid gap-2">
                {children}
                {provided.placeholder}
              </div>
            </header>
          </div>
        );
      }}
    </Droppable>
  );
}
