// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Todo {
    struct Task {
        string text;
        bool completed;
    }

    Task[] public tasks;

    event TaskAdded(string text);

    function addTask(string memory _text) public {
        tasks.push(Task({text: _text, completed: false}));
        emit TaskAdded(_text);
    }

    function toggleTask(uint _index) public {
        require(_index < tasks.length, "Invalid task index");
        tasks[_index].completed = !tasks[_index].completed;
    }

    function getTaskCount() public view returns (uint) {
        return tasks.length;
    }

    function getTask(uint _index) public view returns (string memory, bool) {
        require(_index < tasks.length, "Invalid task index");
        Task storage t = tasks[_index];
        return (t.text, t.completed);
    }
}
