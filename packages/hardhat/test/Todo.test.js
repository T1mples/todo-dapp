import { expect } from "chai";
import hre from "hardhat";

describe("Todo contract", function () {
  let todo;

  beforeEach(async function () {
    const { ethers } = hre;

    const Todo = await ethers.getContractFactory("Todo");
    todo = await Todo.deploy();
    await todo.waitForDeployment();
  });

  it("Should add a new task (write function test)", async function () {
    await todo.addTask("Test task");

    // Получаем количество задач (без аргументов)
    const count = await todo.getTaskCount();
    expect(count).to.equal(1);

    // Получаем задачу по индексу
    const task = await todo.getTask(0);
    expect(task[0]).to.equal("Test task");
    expect(task[1]).to.equal(false);
  });

  it("Should emit TaskAdded event", async function () {
    // Событие TaskAdded содержит только текст задачи
    await expect(todo.addTask("Event task")).to.emit(todo, "TaskAdded").withArgs("Event task");
  });

  it("Should revert when toggling non-existing task (require test)", async function () {
    await expect(todo.toggleTask(0)).to.be.revertedWith("Invalid task index");
  });
});
