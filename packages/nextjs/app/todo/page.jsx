"use client";

import { useState } from "react";
import {
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

export default function TodoPage() {
  const [taskText, setTaskText] = useState("");

  const { data: taskCount } = useScaffoldReadContract({
    contractName: "Todo",
    functionName: "getTaskCount",
    args: [undefined],
    watch: true,
  });

  const { writeContractAsync: addTask } = useScaffoldWriteContract("Todo");
  const { writeContractAsync: toggleTask } = useScaffoldWriteContract("Todo");

  const tasks = [];

  for (let i = 0; i < (taskCount ?? 0); i++) {
    tasks.push(
      useScaffoldReadContract({
        contractName: "Todo",
        functionName: "getTask",
        args: [undefined, i],
        watch: true,
      })
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>TODO List (Blockchain)</h1>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="New task"
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
        />
        <button
          onClick={async () => {
            await addTask({
              functionName: "addTask",
              args: [taskText],
            });
            setTaskText("");
          }}
        >
          Add task
        </button>
      </div>

      <ul>
        {tasks.map((taskHook, index) => {
          const task = taskHook.data;
          if (!task) return null;

          return (
            <li key={index}>
              {task[0]} — {task[1] ? "Completed" : "Not completed"}
              <button
                onClick={async () =>
                  await toggleTask({
                    functionName: "toggleTask",
                    args: [index],
                  })
                }
              >
                Toggle
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
