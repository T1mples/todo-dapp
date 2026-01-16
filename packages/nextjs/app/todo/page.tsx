"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type Task = { text: string; completed: boolean };

export default function TodoPage() {
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Количество задач
  const { data: taskCount } = useScaffoldReadContract({
    contractName: "Todo",
    functionName: "getTaskCount",
    watch: true,
  });

  // Контракты для записи
  const { writeContractAsync: addTask, isMining: isAdding } = useScaffoldWriteContract({ contractName: "Todo" });
  const { writeContractAsync: toggleTask, isMining: isToggling } = useScaffoldWriteContract({ contractName: "Todo" });

  // Контракт для чтения
  const { data: contract } = useScaffoldContract({ contractName: "Todo" });

  const isUserRejectedError = (e: any) => {
    const msg = String(e?.message ?? e ?? "").toLowerCase();
    return (
      e?.code === 4001 ||
      e?.name === "UserRejectedRequestError" ||
      /user (rejected|denied)/i.test(msg) ||
      msg.includes("metaMask tx signature: user denied") ||
      msg.includes("user denied transaction signature")
    );
  };

  // Загрузка задач через массив и функцию getTask
  useEffect(() => {
    const loadTasks = async () => {
      if (taskCount === undefined || !contract) return;

      setError(null);
      setLoading(true);
      try {
        const loaded: Task[] = [];
        const count = Number(taskCount as any);

        // Не перезагружаем, если уже есть все задачи
        if (tasks.length === count) return;

        for (let i = 0; i < count; i++) {
          // Получаем задачу из публичного массива
          const taskFromArray = await contract.read.tasks([BigInt(i)]);

          // Получаем задачу через getTask
          const taskFromFunc = await contract.read.getTask([BigInt(i)]);

          // Проверка совпадения (опционально)
          if (taskFromArray[0] !== taskFromFunc[0] || taskFromArray[1] !== taskFromFunc[1]) {
            console.warn(`Mismatch at task ${i}`, taskFromArray, taskFromFunc);
          }

          loaded.push({ text: taskFromFunc[0], completed: taskFromFunc[1] });
        }
        setTasks(loaded);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [taskCount, contract, tasks.length]);

  useEffect(() => {
    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      const reason = (ev && (ev.reason ?? (ev as any).detail)) as any;
      if (isUserRejectedError(reason)) {
        try {
          ev.preventDefault();
        } catch {}
        toast("Transaction cancelled");
      }
    };

    const onError = (ev: ErrorEvent) => {
      if (isUserRejectedError((ev && ev.error) || ev.message)) {
        try {
          ev.preventDefault();
        } catch {}
        toast("Transaction cancelled");
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection as any);
    window.addEventListener("error", onError as any);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection as any);
      window.removeEventListener("error", onError as any);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Blockchain TODO List</h1>

      {/* Input + Add button */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New task"
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          onClick={async () => {
            setError(null);
            if (!taskText) return;
            const newTask: Task = { text: taskText, completed: false };
            setTasks(prev => [...prev, newTask]); // optimistic update
            setTaskText("");
            try {
              await addTask({ functionName: "addTask", args: [taskText] });
              toast.success("Task added");
            } catch (e: any) {
              setTasks(prev => prev.slice(0, prev.length - 1));
              const msg = e?.message ?? String(e);
              if (isUserRejectedError(e)) toast("Transaction rejected by user");
              else {
                setError(msg);
                toast.error(msg);
              }
            }
          }}
          disabled={!taskText || isAdding}
          className={`px-4 py-2 rounded-md text-white ${
            isAdding ? "bg-gray-400 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {isAdding ? "Adding..." : "Add Task"}
        </button>
      </div>

      {/* Loading & error */}
      {loading && <p className="text-gray-500 mb-4">Loading tasks…</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Task list */}
      <ul className="space-y-3">
        {tasks.map((task, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow"
          >
            <span className={task.completed ? "line-through text-gray-500" : ""}>{task.text}</span>
            <div className="flex gap-2 items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  task.completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {task.completed ? "Completed" : "Not Completed"}
              </span>
              <button
                onClick={async () => {
                  setError(null);
                  setTasks(prev => prev.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t)));
                  try {
                    await toggleTask({ functionName: "toggleTask", args: [BigInt(index)] });
                    toast.success("Toggled");
                  } catch (e: any) {
                    setTasks(prev => prev.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t)));
                    const msg = e?.message ?? String(e);
                    if (isUserRejectedError(e)) toast("Transaction rejected by user");
                    else {
                      setError(msg);
                      toast.error(msg);
                    }
                  }
                }}
                disabled={isToggling}
                className={`px-3 py-1 rounded-md text-white ${
                  isToggling ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isToggling ? "Toggling..." : "Toggle"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
