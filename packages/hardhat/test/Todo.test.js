const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Todo contract", function () {
  let todo;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Todo = await ethers.getContractFactory("Todo");
    todo = await Todo.deploy();
    await todo.waitForDeployment();
  });

  it("Should add a new task (write function test)", async function () {
    await todo.addTask("Test task");

    const count = await todo.getTaskCount(owner.address);
    expect(count).to.equal(1);

    const task = await todo.getTask(owner.address, 0);
    expect(task[0]).to.equal("Test task");
    expect(task[1]).to.equal(false);
  });

  it("Should emit TaskAdded event", async function () {
    await expect(todo.addTask("Event task"))
      .to.emit(todo, "TaskAdded")
      .withArgs(owner.address, "Event task");
  });

  it("Should revert when toggling non-existing task (require test)", async function () {
    await expect(todo.toggleTask(0)).to.be.revertedWith("Invalid task index");
  });
});
