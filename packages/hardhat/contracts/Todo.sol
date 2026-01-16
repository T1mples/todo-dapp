// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Todo {
    struct Task {
        string text;
        bool completed;
    }

    mapping(address => Task[]) private tasks;

    event TaskAdded(address indexed user, string text);
    event TaskStatusChanged(address indexed user, uint256 index, bool completed);

    function getTaskCount(address user) external view returns (uint256) {
        return tasks[user].length;
    }

    function getTask(address user, uint256 index) external view returns (string memory, bool) {
        require(index < tasks[user].length, "Invalid task index");
        Task memory task = tasks[user][index];
        return (task.text, task.completed);
    }

    function addTask(string calldata text) external {
        tasks[msg.sender].push(Task(text, false));
        emit TaskAdded(msg.sender, text);
    }

    function toggleTask(uint256 index) external {
        require(index < tasks[msg.sender].length, "Invalid task index");
        Task storage task = tasks[msg.sender][index];
        task.completed = !task.completed;
        emit TaskStatusChanged(msg.sender, index, task.completed);
    }
}
