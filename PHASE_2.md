# Phase 2: Core Project Working (40% Milestone)

**Status: COMPLETED**

This phase represents the core working functionality of the PortFlow system. By completing this phase, we have built the working foundation for both the **Admin Panel** and the **User Panel**. The Login mechanism is completely functional. 

Most importantly, this 40% phase perfectly integrates the core Operating System (OS) and Database Management System (DBMS) concepts. 

---

## OS Concepts Used in Phase 2

Here is exactly how Operating System concepts are implemented in this working phase:

| OS Concept | PortFlow Feature | How it is used in Phase 2 |
| :--- | :--- | :--- |
| **Process** | Port Jobs | Every job (like unloading a ship) is treated as a process. |
| **CPU Scheduling** | Job Scheduling | Deciding which job goes first using FCFS (First-Come, First-Served) rules for the active panels. |
| **Ready Queue** | Waiting Line | A line for jobs that are ready but waiting for their turn. |
| **Waiting Time** | Time Spent Waiting | How long a job sits in the waiting line before starting. |
| **Turnaround Time** | Total Time Taken | The total time from when the job was asked for until it finished. |
| **Process Synchronization** | Sharing Equipment | Making sure two jobs don't mess up by trying to use the same crane (using Mutex locks). |

---

## DBMS Concepts Used in Phase 2

Here is exactly how Database Management System concepts are implemented alongside the OS concepts:

| DBMS Concept | PortFlow Feature | How it is used in Phase 2 |
| :--- | :--- | :--- |
| **Tables** | Port Data | Places to store data like users, ships, and berths for the Admin Panel. |
| **Primary Key** | Unique ID | A unique number for every single record so we don't mix them up (e.g., User ID). |
| **Foreign Key** | Links | A way to safely link an operation to a specific user or ship. |
| **Normalization** | Clean Design | Organizing the database so we don't repeat the same data over and over. |
| **SQL (CRUD)** | Data Management | The `SELECT` and `INSERT` queries used by the working User and Admin panels. |
Aggregate Functions	AnalyticsDoing math like COUNT or SUM to see total bills or total containers.
| **Transactions** | Safe Saves | Making sure a complex save (like locking an OS resource AND updating the DB) either completely works or completely fails. |

---


