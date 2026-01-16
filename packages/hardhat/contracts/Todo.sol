// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Todo {
    struct Task {
        string text;
        bool completed;
    }

    Task[] public tasks;

    // Добавить задачу
    function addTask(string memory _text) public {
        tasks.push(Task({text: _text, completed: false}));
    }

    // Переключить статус задачи
    function toggleTask(uint _index) public {
        require(_index < tasks.length, "Invalid task index");
        tasks[_index].completed = !tasks[_index].completed;
    }

    // Получить количество задач
    function getTaskCount() public view returns (uint) {
        return tasks.length;
    }

    // Получить задачу по индексу
    function getTask(uint _index) public view returns (string memory, bool) {
        require(_index < tasks.length, "Invalid task index");
        Task storage t = tasks[_index];
        return (t.text, t.completed);
    }
}
